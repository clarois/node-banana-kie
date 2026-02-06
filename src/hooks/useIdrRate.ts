import { useEffect, useState } from "react";
import {
  getCachedIdrRate,
  setCachedIdrRate,
  IDR_PER_USD,
  IDR_RATE_TTL_MS,
  fetchIdrRate,
} from "@/utils/costCalculator";

export function useIdrRate(): number {
  const [rate, setRate] = useState(IDR_PER_USD);

  useEffect(() => {
    const cached = getCachedIdrRate();
    if (cached?.rate) {
      setRate(cached.rate);
    }

    const now = Date.now();
    const shouldFetch = !cached || now - cached.updatedAt > IDR_RATE_TTL_MS;
    if (!shouldFetch) return undefined;

    let isActive = true;

    fetchIdrRate()
      .then((nextRate) => {
        if (typeof nextRate === "number" && nextRate > 0) {
          setCachedIdrRate(nextRate);
          if (isActive) {
            setRate(nextRate);
          }
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  return rate;
}
