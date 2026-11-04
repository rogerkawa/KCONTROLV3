import { useEffect, useState } from 'react';

export function useTemaAtual() {
    const [tema, setTema] = useState(() =>
        document.documentElement.getAttribute('data-theme') || 'dark'
    );

    useEffect(() => {
        const atualizarTema = () => {
            setTema(
                document.documentElement.getAttribute('data-theme') || 'dark'
            );
        };

        const observer = new MutationObserver(atualizarTema);

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        atualizarTema();

        return () => observer.disconnect();
    }, []);

    return tema;
}