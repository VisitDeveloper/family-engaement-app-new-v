import { StateCreator } from 'zustand';

export interface Resource {
    id: string;
    type: string;
    title: string;
    age: string;
    category: string;
    rating: number;
    // image: any;
}

export interface ResourceSlice {
    resources: Resource[];
    addResource: (resource: Resource) => void;
    getResourceById: (resourceId: string) => Resource | undefined;
}

export const createResourceSlice: StateCreator<any, [], [], ResourceSlice> = (set, get) => ({
    resources: [
        {
            id: '1',
            type: 'Book',
            title: 'The Very Hungry Caterpillar',
            age: '3-5 years',
            category: 'Nature',
            rating: 4.8,
            // image: require('./../../assets/images/react-logo.png'),
        },
    ],

    addResource: (resource) =>
        set((state: any) => ({
            resources: [...state.resources, resource],
        })),

    getResourceById: (resourceId) =>
        get().resources.find((c: Resource) => c.id === resourceId),
});
