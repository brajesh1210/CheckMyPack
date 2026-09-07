import { useApp } from "../store/app";
import Onboarding from "./onboarding/Onboarding";
import Auth from "./Auth";
import MainTabs from "./MainTabs";

export default function AppFlow() {
  const screen = useApp((s) => s.screen);
  const onboarded = useApp((s) => s.onboarded);

  // persisted state may jump straight to app
  const stage = screen === "app" || (onboarded && screen !== "onboarding" && screen !== "auth")
    ? screen
    : screen;

  if (stage === "onboarding") return <Onboarding />;
  if (stage === "auth") return <Auth />;
  return <MainTabs />;
}
