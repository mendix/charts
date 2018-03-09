class DefaultPage {

    public open(): void {
        browser.url("/p/home");
    }
}
const defaultPage = new DefaultPage();
export default defaultPage;
