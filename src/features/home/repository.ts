import { mockHomeData } from "../../mocks/home";
import type { HomeData } from "../../types/home";

export async function getHomeData(): Promise<HomeData> {
  return Promise.resolve(mockHomeData);
}
