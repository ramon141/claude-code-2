import React from "react";
import useDimensions from "../../hooks/useDimensions";
import DashboardMobile from "./DashboardMobile";
import DashboardDesktop from "./DashboardDesktop";

interface PrivateLayoutProps {
  children: React.ReactNode;
  useSearch?: boolean;
  useBackground?: boolean;
  useBackgroundMobile?: boolean;
  breadcrumb?: boolean;
}

const PrivateLayout: React.FC<PrivateLayoutProps> = (props) => {
  const { width } = useDimensions();

  if (width < 900) return <DashboardMobile {...props} />;
  return <DashboardDesktop {...props} />;
};

export default PrivateLayout;
