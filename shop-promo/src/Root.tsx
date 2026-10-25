import { MyComposition } from "./Composition";
import { PremiumComposition } from "./premium/Premium";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <PremiumComposition />
    </>
  );
};
