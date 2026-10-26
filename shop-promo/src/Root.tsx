import { MyComposition } from "./Composition";
import { PremiumComposition } from "./premium/Premium";
import { Premium15Composition } from "./premium15/Video";
import { Episode1Composition } from "./episode1/Video";
import { BrandkitCompositions } from "./flownova/Brandkit";
import { FlownovaEp2Composition } from "./flownova/Episode2";
import { FlownovaEp2ShortComposition } from "./flownova/Episode2Short";
import { FlownovaSignsComposition } from "./flownova/Signs";
import { FlownovaComposition } from "./flownova/Video";
import { WednesdayCompositions } from "./flownova/Wednesday";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <PremiumComposition />
      <Premium15Composition />
      <Episode1Composition />
      <FlownovaComposition />
      <FlownovaEp2Composition />
      <FlownovaEp2ShortComposition />
      <FlownovaSignsComposition />
      <WednesdayCompositions />
      <BrandkitCompositions />
    </>
  );
};
