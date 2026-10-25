import { MyComposition } from "./Composition";
import { PremiumComposition } from "./premium/Premium";
import { Premium15Composition } from "./premium15/Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <PremiumComposition />
      <Premium15Composition />
    </>
  );
};
