import { MyComposition } from "./Composition";
import { PremiumComposition } from "./premium/Premium";
import { Premium15Composition } from "./premium15/Video";
import { Episode1Composition } from "./episode1/Video";
import { FlownovaEp2Composition } from "./flownova/Episode2";
import { FlownovaComposition } from "./flownova/Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <PremiumComposition />
      <Premium15Composition />
      <Episode1Composition />
      <FlownovaComposition />
      <FlownovaEp2Composition />
    </>
  );
};
