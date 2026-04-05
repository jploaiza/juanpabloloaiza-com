"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export default function SchedulePage() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "trvp" });
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <main className="min-h-screen w-full bg-white">
      <div className="w-full h-full p-4 sm:p-8">
        <Cal
          namespace="trvp"
          calLink="jploaizao/trvp"
          style={{
            width: "100%",
            height: "600px",
            overflow: "auto",
          }}
          config={{
            layout: "month_view",
            theme: "light",
          }}
        />
      </div>
    </main>
  );
}
