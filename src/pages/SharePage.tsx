import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePipelineStore } from "../stores/pipeline.store";
import type { PipelineNode, PipelineEdge } from "../types";

export function SharePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loadPipeline = usePipelineStore((s) => s.loadPipeline);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!shareId || !/^[a-z0-9]{8}$/.test(shareId)) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/pipeline/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        const pipeline = d?.data?.pipeline;
        const nodes = pipeline?.nodes as PipelineNode[] | undefined;
        const edges = pipeline?.edges as PipelineEdge[] | undefined;
        if (!Array.isArray(nodes) || nodes.length === 0) throw new Error("empty");
        loadPipeline(nodes, Array.isArray(edges) ? edges : []);
        navigate("/editor", { replace: true });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [shareId, loadPipeline, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D14] text-gray-400 text-sm px-6 text-center">
      {failed ? t("share.notFound") : t("share.loading")}
    </div>
  );
}
