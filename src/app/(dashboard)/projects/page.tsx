import { auth } from "@/auth";
import { prisma } from "@/auth";
import { redirect } from "next/navigation";
import { ProjectCard, ProjectModal } from "./project-components";
import { getActiveOrgId } from "@/lib/permissions";

export default async function ProjectsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const orgId = await getActiveOrgId();

  if (!userId || !orgId) {
    redirect("/login");
  }

  // Fetch real projects from database
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Projects Inventory</h1>
        <ProjectModal organizationId={orgId} />
      </div>

      <p className="text-sm text-muted-foreground">
        Add your properties here. These will automatically appear in your Flow Builder Dynamic Lists!
      </p>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-xl border-dashed bg-muted/20 text-center">
          <h3 className="font-semibold text-lg">No projects added yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Click "Add Project" to create your first property listing.</p>
          <ProjectModal organizationId={orgId} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              organizationId={orgId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
