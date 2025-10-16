// Simple pages fetcher used by App to build routes.
// This currently returns a static list but can be updated to fetch from backend API.

export async function fetchPages() {
    // Simulate network latency
    await new Promise((res) => setTimeout(res, 120));

    // The id corresponds to the keys used in App routeMapping
    return [
        { id: 'feed', path: '/feed', label: 'Feed' },
        { id: 'graph', path: '/graph', label: 'Knowledge Graph' },
        { id: 'pds', path: '/pds', label: 'PDS Dashboard' },
        { id: 'github', path: '/github', label: 'GitHub' },
        { id: 'users', path: '/users', label: 'Users' },
        { id: 'projectHub', path: '/project-hub', label: 'Project Hub' },
    ];
}
