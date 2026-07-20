import type { State, District, City, Neighborhood } from "@/lib/types";

// Using a Map for easier CRUD operations
export const states = new Map<string, State>([
    ['state-01', { id: 'state-01', name: 'Riyadh Province', code: '01', country: 'Saudi Arabia' }],
    ['state-02', { id: 'state-02', name: 'Makkah Province', code: '02', country: 'Saudi Arabia' }],
    ['state-03', { id: 'state-03', name: 'Dubai', code: 'DU', country: 'United Arab Emirates' }],
]);

export const districts = new Map<string, District>([
    ['dist-01', { id: 'dist-01', name: 'Riyadh', stateId: 'state-01' }],
    ['dist-02', { id: 'dist-02', name: 'Jeddah', stateId: 'state-02' }],
    ['dist-03', { id: 'dist-03', name: 'Dubai City', stateId: 'state-03' }],
]);

export const cities = new Map<string, City>([
    ['city-01', { id: 'city-01', name: 'Riyadh', districtId: 'dist-01' }],
    ['city-02', { id: 'city-02', name: 'Jeddah', districtId: 'dist-02' }],
    ['city-03', { id: 'city-03', name: 'Downtown Dubai', districtId: 'dist-03' }],
]);

export const neighborhoods = new Map<string, Neighborhood>([
    ['hood-01', { id: 'hood-01', name: 'Al-Olaya', cityId: 'city-01' }],
    ['hood-02', { id: 'hood-02', name: 'Al-Hamra', cityId: 'city-02' }],
    ['hood-03', { id: 'hood-03', name: 'Burj Khalifa Area', cityId: 'city-03' }],
]);

export const geoData = {
    states,
    districts,
    cities,
    neighborhoods,
};

// Function to reset the data for demo purposes if needed
export function resetGeoData() {
    geoData.states = new Map<string, State>([
        ['state-01', { id: 'state-01', name: 'Riyadh Province', code: '01', country: 'Saudi Arabia' }],
        ['state-02', { id: 'state-02', name: 'Makkah Province', code: '02', country: 'Saudi Arabia' }],
        ['state-03', { id: 'state-03', name: 'Dubai', code: 'DU', country: 'United Arab Emirates' }],
    ]);
    // Add similar resets for other entities if they can be modified.
}
