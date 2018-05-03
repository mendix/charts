interface Window {
    dojoConfig: {
        cacheBust: string;
    };
    dojo: typeof dojo & { locale: string };
}
