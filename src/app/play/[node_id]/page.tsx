import PlayClient from "./PlayClient";

export function generateStaticParams() {
  return [
    { node_id: "parallel_transversals" },
    { node_id: "triangle_sum" },
    { node_id: "lines_angles_transversal" },
    { node_id: "MATH.GEOMETRY.LinesAngles" },
    { node_id: "MATH.GEOMETRY.TriangleSum" },
  ];
}

interface PageProps {
  params: Promise<{ node_id: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <PlayClient node_id={resolvedParams.node_id} />;
}
