interface Window {
    dojoConfig: {
        cacheBust: string;
    };
    dojo: typeof dojo & { locale: string };
    __REDUX_DEVTOOLS_EXTENSION__?: () => any;
}
