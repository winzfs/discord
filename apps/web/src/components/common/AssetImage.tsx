import { resolveAsset } from "../../assets/assetManifest";
import type { AssetKey } from "../../assets/assetTypes";

type AssetImageProps = {
  assetKey?: AssetKey;
  className?: string;
};

export function AssetImage({ assetKey, className }: AssetImageProps) {
  const asset = resolveAsset(assetKey);

  return <img className={className} src={asset.src} alt={asset.alt} loading="lazy" />;
}
