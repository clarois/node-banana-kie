"use client";

import { useState, useMemo } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { calculatePredictedCost, formatCost, formatCostIdr } from "@/utils/costCalculator";
import { useIdrRate } from "@/hooks/useIdrRate";
import { CostDialog } from "./CostDialog";

export function CostIndicator() {
  const [showDialog, setShowDialog] = useState(false);
  const nodes = useWorkflowStore((state) => state.nodes);
  const incurredCost = useWorkflowStore((state) => state.incurredCost);
  const idrRate = useIdrRate();

  const predictedCost = useMemo(() => {
    return calculatePredictedCost(nodes);
  }, [nodes]);

  const hasAnyNodes = predictedCost.nodeCount > 0;

  if (!hasAnyNodes && incurredCost === 0) {
    return null;
  }

  // Show USD with IDR conversion
  const displayCost = `${formatCost(predictedCost.totalCost)} • ${formatCostIdr(
    predictedCost.totalCost,
    idrRate
  )}`;

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="px-2 py-0.5 rounded text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        title="View cost details"
      >
        {displayCost}
      </button>

      {showDialog && (
        <CostDialog
          predictedCost={predictedCost}
          incurredCost={incurredCost}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
