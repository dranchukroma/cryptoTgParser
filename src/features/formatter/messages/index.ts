import type { parseMessageType, ReviewData, SignalData, SignalUpdateData } from "../../types/messages.js";
import { renderDaily, renderReview, renderSignal, renderSignalUpdate } from "./formatByType.js";

export async function formatMessage(
    type: parseMessageType | null,
    orgMsg: string | null,
    data: SignalData | SignalUpdateData | ReviewData | null
  ): Promise<string | null> {
    if(!type || !orgMsg || !data) return null
    switch (type) {
      case "signal":
        return renderSignal(orgMsg, data as SignalData);
      case "signal_update":
        return renderSignalUpdate(orgMsg, data as SignalUpdateData);
      case "daily":
        return renderDaily(orgMsg);
      case "review":
        return renderReview(orgMsg, data as ReviewData);
      default: return null
    }
  }