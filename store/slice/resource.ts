import { StateCreator } from "zustand";

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: "book" | "activity" | "video";
  category: string;
  ageRange: string | null;
  imageUrl: string | null;
  contentUrl: string | null;
  averageRating: number;
  ratingsCount: number;
  createdBy: any | null;
  isSaved: boolean;
  userRating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceSlice {
  resources: Resource[];
  addResource: (resource: Resource) => void;
  removeResource: (resourceId: string) => void;
  getResourceById: (resourceId: string) => Resource | undefined;
}

export const createResourceSlice: StateCreator<any, [], [], ResourceSlice> = (
  set,
  get
) => ({
  resources: [
    {
      id: "1",
      title: "The Very Hungry Caterpillar",
      description:
        "A classic story about the transformation of a caterpillar into a beautiful butterfly.",
      type: "book",
      category: "Nature",
      ageRange: "3-5 years",
      imageUrl: null,
      contentUrl: null,
      averageRating: 4.8,
      ratingsCount: 0,
      createdBy: null,
      isSaved: false,
      userRating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],

  addResource: (resource) => {
    set((state: any) => {
      const existingIndex = state.resources.findIndex(
        (r: Resource) => r.id === resource.id
      );
      
      if (existingIndex >= 0) {
        // Update existing resource
        const updatedResources = [...state.resources];
        updatedResources[existingIndex] = resource;
        return { resources: updatedResources };
      } else {
        // Add new resource
        return { resources: [...state.resources, resource] };
      }
    });
  },

  removeResource: (resourceId) => {
    set((state: any) => ({
      resources: state.resources.filter((r: Resource) => r.id !== resourceId),
    }));
  },

  getResourceById: (resourceId) =>
    get().resources.find((c: Resource) => c.id === resourceId),
});
