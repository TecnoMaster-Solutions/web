import { CreateUserData } from "../types/typesUser";

interface BuildUserPayloadArgs {
  formData: CreateUserData;
  imageUrl: string | null;
  cvUrl: string | null;
}

export function buildUserPayload({
  formData,
  imageUrl,
  cvUrl,
}: BuildUserPayloadArgs) {
  return {
    ...formData,

    image: imageUrl ?? null,
    CV: cvUrl ?? null,

    techniciantypeids:
      formData.techniciantypeids && formData.techniciantypeids.length > 0
        ? formData.techniciantypeids
        : undefined,

    customercity: formData.customercity?.trim() || undefined,
    customerzipcode: formData.customerzipcode?.trim() || undefined,
  };
}
