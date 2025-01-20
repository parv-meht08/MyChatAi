import { WebContainer } from '@webcontainer/api';

// Call only once
let webcontainerInstance = null;

export const getWebContainer = async () => {
    if (!webcontainerInstance) {
        try {
            webcontainerInstance = await WebContainer.boot();
        } catch (error) {
            console.error('Failed to boot WebContainer:', error);
            throw error;
        }
    }
    return webcontainerInstance;
}