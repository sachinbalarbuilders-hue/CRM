import { prisma } from "@/auth";
import { sendWhatsAppMessage } from "./whatsapp";

// Simple safe evaluator for flow conditions
function evaluateCondition(variable: string, incomingText: string): boolean {
  try {
    const text = incomingText.trim().toLowerCase();
    
    // Support simple format like "reply == 1" or "reply == 'yes'"
    let expression = variable.toLowerCase();
    
    // Replace unquoted numbers or strings with safe comparison
    if (expression.includes("==")) {
      const parts = expression.split("==").map(s => s.trim());
      if (parts[0] === "reply") {
        const expected = parts[1].replace(/['"]/g, ""); // strip quotes
        return text === expected;
      }
    } else if (expression.includes("!=")) {
      const parts = expression.split("!=").map(s => s.trim());
      if (parts[0] === "reply") {
        const expected = parts[1].replace(/['"]/g, ""); // strip quotes
        return text !== expected;
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

export async function processFlow(conversationId: string, incomingText: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { activeFlow: true }
  });

  if (!conversation || !conversation.activeFlow) return;

  const flow = conversation.activeFlow;
  const nodes = flow.nodes as any[];
  const edges = flow.edges as any[];

  let currentNodeId = conversation.currentFlowNodeId;

  // If no current node, start from the trigger
  if (!currentNodeId) {
    const triggerNode = nodes.find(n => n.type === "trigger" || n.type === "input");
    if (!triggerNode) return;
    currentNodeId = triggerNode.id;
  }

  // Track which node is next
  let nextNodeId: string | null = currentNodeId;
  let iterations = 0;
  const MAX_ITERATIONS = 50; // Prevent infinite loops
  let processing = true;
  let currentId = currentNodeId;

  while (processing) {
    // Find edges originating from currentId
    const outgoingEdges = edges.filter(e => e.source === currentId);
    
    if (outgoingEdges.length === 0) {
      // Flow ended
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { activeFlowId: null, currentFlowNodeId: null }
      });
      break;
    }

    let nextNodeId: string | null = null;
    const currentNode = nodes.find(n => n.id === currentId);

    if (currentNode?.type === "interactive_menu") {
      let matchingEdge = outgoingEdges.find(e => e.sourceHandle === incomingText);
      
      // Fallback: If user typed the title instead of clicking button, match by title
      if (!matchingEdge) {
        const opts = currentNode.data.options as any[] || [];
        const matchedOpt = opts.find(o => o.title.toLowerCase() === incomingText.toLowerCase());
        if (matchedOpt) {
          matchingEdge = outgoingEdges.find(e => e.sourceHandle === matchedOpt.id);
        }
      }

      if (matchingEdge) {
        nextNodeId = matchingEdge.target;
      } else {
        processing = false;
        break;
      }
    } else if (currentNode?.type === "wait") {
      // If incoming text is 'timeout_triggered', we take the timeout edge. Otherwise, replied edge.
      const handle = incomingText === "timeout_triggered" ? "timeout" : "replied";
      const matchingEdge = outgoingEdges.find(e => e.sourceHandle === handle) || outgoingEdges[0];
      if (matchingEdge) {
        nextNodeId = matchingEdge.target;
      } else {
        processing = false;
        break;
      }
    } else if (currentNode?.type === "validate" || currentNode?.type === "api" || currentNode?.type === "business_hours") {
      // These nodes determine their own next paths internally, but wait... 
      // Actually, we pass through them below by setting `currentId = nextNode.id; continue;`
      // If we are currently AT one, it means we somehow paused on it? They shouldn't pause.
      // But if we did, just take the first edge.
      nextNodeId = outgoingEdges[0]?.target;
    } else {
      // We are leaving the current node (e.g. moving past a dynamic_list or message)
      // If we are leaving a dynamic_list node, we MUST save their selection before moving on!
      if (currentNode?.type === "dynamic_list" && incomingText && incomingText !== "0") {
        const variableName = currentNode.data.variableName as string || "selected_project";
        let selectedProject = await prisma.project.findUnique({ where: { id: incomingText } });
        
        // Fallback: If they typed the name manually instead of clicking the list item
        if (!selectedProject) {
          selectedProject = await prisma.project.findFirst({
            where: {
              name: { equals: incomingText, mode: 'insensitive' },
              organizationId: conversation.organizationId
            }
          });
        }

        if (selectedProject) {
          const currentVars = conversation.flowVariables as Record<string, any> || {};
          currentVars[variableName] = selectedProject.name;
          currentVars[`${variableName}_brochure`] = selectedProject.brochureUrl || ""; 
          currentVars[`${variableName}_virtual_tour`] = selectedProject.virtualTourUrl || ""; 
          currentVars[`${variableName}_description`] = selectedProject.description || ""; 
          currentVars[`${variableName}_location`] = selectedProject.location || ""; 
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { flowVariables: currentVars }
          });
          conversation.flowVariables = currentVars;
        }
      }

      // What are the immediate next nodes?
      const potentialNextNodes = outgoingEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);

      // If the next nodes are Conditions, it means we are branching based on user input
      if (potentialNextNodes.length > 0 && potentialNextNodes.every(n => n.type === "condition")) {
        let matchedNode = null;
        let fallbackNode = null;

        for (const node of potentialNextNodes) {
          const condition = (node.data.variable as string || "").toLowerCase();
          if (condition === "invalid reply" || condition.includes("else") || condition.includes("fallback")) {
            fallbackNode = node;
          } else if (evaluateCondition(condition, incomingText)) {
            matchedNode = node;
            break;
          }
        }

        const selectedConditionNode = matchedNode || fallbackNode;

        if (!selectedConditionNode) {
          processing = false;
          break;
        }

        const conditionOutgoing = edges.find(e => e.source === selectedConditionNode.id);
        if (conditionOutgoing) {
          nextNodeId = conditionOutgoing.target;
        } else {
          processing = false;
          break;
        }
      } else {
        nextNodeId = outgoingEdges[0]?.target;
      }
    }

    if (!nextNodeId) break;

    const nextNode = nodes.find(n => n.id === nextNodeId);
    if (!nextNode) break;

    // Process the next node
    if (nextNode.type === "message") {
      let msgText = nextNode.data.message as string;
      
      // Interpolate variables like {{selected_project}}
      if (msgText && msgText.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          msgText = msgText.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
      }

      const buttons = nextNode.data.buttons as { id: string; title: string }[] | undefined;
      let mediaUrl = nextNode.data.mediaUrl as string | undefined;
      const mediaType = nextNode.data.mediaType as string | undefined;
      let mediaName = nextNode.data.mediaName as string | undefined;
      
      if (mediaName && mediaName.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          mediaName = mediaName.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
      }
      
      // Interpolate mediaUrl (e.g. {{selected_project_brochure}})
      if (mediaUrl && mediaUrl.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          mediaUrl = mediaUrl.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
        // If mediaUrl ends up empty after interpolation (e.g., no brochure uploaded), don't send a broken file
        if (!mediaUrl.startsWith("http")) {
          mediaUrl = undefined;
        }
      }
      
      if (msgText || mediaUrl) {
        await sendWhatsAppMessage({
          organizationId: conversation.organizationId,
          conversationId: conversation.id,
          phoneNumber: conversation.phoneNumber,
          text: msgText,
          mediaUrl,
          mediaType: mediaType || (mediaUrl ? "document" : undefined),
          mediaName,
          buttons,
        });
      }
      currentId = nextNode.id;

      // IMPLICIT WAIT: If this message is followed by conditions, we must pause and wait for the user's reply!
      const nextNextEdges = edges.filter(e => e.source === currentId);
      const nextNextNodes = nextNextEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
      if (nextNextNodes.length > 0 && nextNextNodes.every(n => n.type === "condition")) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { currentFlowNodeId: currentId }
        });
        processing = false;
      }
    } else if (nextNode.type === "interactive_menu") {
      let msgText = nextNode.data.message as string || "Please select an option:";
      if (msgText && msgText.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          msgText = msgText.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
      }
      const options = nextNode.data.options as any[] || [];
      const buttons = options.map(o => ({ id: o.id, title: o.title.substring(0, 20) }));

      await sendWhatsAppMessage({
        organizationId: conversation.organizationId,
        conversationId: conversation.id,
        phoneNumber: conversation.phoneNumber,
        text: msgText,
        buttons,
      });

      currentId = nextNode.id;
      
      // Interactive menu ALWAYS pauses and waits for user's reply
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentFlowNodeId: currentId }
      });
      processing = false;

    } else if (nextNode.type === "dynamic_list") {
      // Dynamic Database List Node
      let msgText = nextNode.data.message as string || "Please select an option:";
      if (msgText && msgText.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          msgText = msgText.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
      }
      const filterField = nextNode.data.filterField as string;
      const filterValue = nextNode.data.filterValue as string;
      
      // Query projects
      const whereClause: any = { organizationId: conversation.organizationId, status: "ACTIVE" };
      if (filterField && filterValue) {
        whereClause[filterField] = filterValue;
      }
      
      const projects = await prisma.project.findMany({
        where: whereClause,
        orderBy: { order: 'asc' },
        take: 10
      });
      
      const buttons = projects.map(p => ({
        id: p.id,
        title: p.name.substring(0, 20) // WhatsApp limits title length
      }));
      
      buttons.push({ id: "0", title: "Main Menu" });

      // Before sending, if the user JUST replied to this node, we need to process their reply!
      // Wait! `processFlow` is called ON an incoming message. 
      // If `conversation.currentFlowNodeId` WAS this dynamic_list, it means the `incomingText` is their selection!
      // But we are currently in the loop moving FORWARD. 
      // If we just landed on `dynamic_list`, we must SEND the buttons and wait.
      // If we are evaluating conditions AFTER `dynamic_list`, the engine already handled `incomingText` in the condition loop!
      // WAIT! The engine doesn't inherently save variables unless we tell it to.
      
      await sendWhatsAppMessage({
        organizationId: conversation.organizationId,
        conversationId: conversation.id,
        phoneNumber: conversation.phoneNumber,
        text: msgText,
        buttons,
      });
      currentId = nextNode.id;

      // Always wait for reply
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentFlowNodeId: currentId }
      });
      processing = false;

    } else if (nextNode.type === "wait") {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { currentFlowNodeId: nextNode.id }
      });
      processing = false;
    } else if (nextNode.type === "transfer") {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { activeFlowId: null, currentFlowNodeId: "transferred", status: "open", assignedToId: null }
      });
      processing = false;
    } else if (nextNode.type === "validate") {
      const type = nextNode.data.validationType as string || "text";
      let isValid = false;
      if (type === "email") isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(incomingText);
      else if (type === "phone") isValid = /^\+?[\d\s-]{7,15}$/.test(incomingText);
      else if (type === "number") isValid = !isNaN(Number(incomingText));
      else isValid = incomingText.trim().length > 0;

      if (isValid && nextNode.data.variableName) {
        const currentVars = conversation.flowVariables as Record<string, any> || {};
        currentVars[nextNode.data.variableName as string] = incomingText;
        await prisma.conversation.update({ where: { id: conversationId }, data: { flowVariables: currentVars } });
        conversation.flowVariables = currentVars;
      }

      const matchingEdge = edges.find(e => e.source === nextNode.id && e.sourceHandle === (isValid ? "valid" : "invalid"));
      
      if (!isValid && nextNode.data.errorMessage) {
        await sendWhatsAppMessage({
          organizationId: conversation.organizationId,
          conversationId: conversation.id,
          phoneNumber: conversation.phoneNumber,
          text: nextNode.data.errorMessage as string,
        });
      }

      if (matchingEdge) {
        currentId = nextNode.id;
        nextNodeId = matchingEdge.target;
        // Don't break, continue processing next node instantly
        const fakeNode = nodes.find(n => n.id === nextNodeId);
        if (fakeNode) {
          // We can just loop!
          currentId = nextNode.id;
        } else { processing = false; break; }
      } else {
        processing = false; break;
      }

    } else if (nextNode.type === "tag") {
      const tagName = nextNode.data.tagName as string;
      if (tagName) {
        const currentTags = conversation.tags || [];
        if (!currentTags.includes(tagName)) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { tags: { push: tagName } }
          });
          conversation.tags = [...currentTags, tagName];
        }
      }
      currentId = nextNode.id;

    } else if (nextNode.type === "api") {
      const url = nextNode.data.url as string;
      const method = nextNode.data.method as string || "POST";
      let bodyString = nextNode.data.bodyTemplate as string || "";
      
      if (bodyString && bodyString.includes("{{") && conversation.flowVariables) {
        const vars = conversation.flowVariables as Record<string, any>;
        for (const [key, value] of Object.entries(vars)) {
          bodyString = bodyString.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value || ""));
        }
      }

      let success = false;
      try {
        if (url) {
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: method !== "GET" ? bodyString : undefined
          });
          success = res.ok;
        }
      } catch (e) { success = false; }

      const matchingEdge = edges.find(e => e.source === nextNode.id && e.sourceHandle === (success ? "success" : "error"));
      if (matchingEdge) {
        currentId = nextNode.id;
        // The loop will find outgoing edges from currentId next!
      } else { processing = false; break; }

    } else if (nextNode.type === "business_hours") {
      const tz = nextNode.data.timezone as string || "UTC";
      const start = nextNode.data.startTime as string || "09:00";
      const end = nextNode.data.endTime as string || "17:00";
      
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
      const parts = formatter.formatToParts(now);
      const hourPart = parts.find(p => p.type === 'hour')?.value || "00";
      const minutePart = parts.find(p => p.type === 'minute')?.value || "00";
      const weekday = parts.find(p => p.type === 'weekday')?.value || "Mon";
      
      const currentTime = `${hourPart}:${minutePart}`;
      const isOpen = weekday !== "Sat" && weekday !== "Sun" && currentTime >= start && currentTime <= end;

      const matchingEdge = edges.find(e => e.source === nextNode.id && e.sourceHandle === (isOpen ? "open" : "closed"));
      if (matchingEdge) {
        currentId = nextNode.id;
      } else { processing = false; break; }

    } else if (nextNode.type === "end") {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { activeFlowId: null, currentFlowNodeId: null }
      });
      processing = false;
    } else {
      currentId = nextNode.id;
    }
  }
}
