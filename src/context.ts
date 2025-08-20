import { UserIdentifyingHeaders } from "./tools/common";

export type Context = {
  apiKey: string;
  baseUrl: string;
  userIdentifyingHeaders: UserIdentifyingHeaders;
};
