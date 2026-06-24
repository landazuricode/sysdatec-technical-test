import { useEffect } from "react";
import { useNavigation } from "react-router";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, trickleSpeed: 120 });

export function NavigationProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";

  useEffect(() => {
    if (isNavigating) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isNavigating]);

  return null;
}
