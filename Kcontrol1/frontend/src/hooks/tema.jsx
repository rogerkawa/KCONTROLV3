import { useEffect, useState } from 'react';

export function useTemaAtual() {
    const [tema, setTema] = useState(
        document.documentElement.getAttribute('data-theme') || 'dark'
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTema(
                document.documentElement.getAttribute('data-theme') || 'dark'
            );
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    return tema;
}