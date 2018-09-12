# Namebase Handshake Extension

NHE addon for Firefox lets you browse Handshake domains:

-------

If you type an address like `turbomaze` into the address bar and hit Enter - you will be taken to Google search page. You have to type `http://turbomaze` or add a slash at the end: `turbomaze/`.

-------

## Installing Debug Version

Debug (unsigned) extensions are only loaded for the current session. They will disappear when Firefox is restarted.

**Disable existing NHE extension, if installed, before installing its debug version!**

1. Open Add-ons Manager tab: click on the button with 3 horizontal lines, then click on _Add-ons_ button.
2. Open debug page: click on the icon with a cog, then click on _Debug Add-ons_ item. (This and the previous step can be replaced by direct navigation to `about:debugging#addons`.)
3. In the tab that has just opened, click on _Load Temporary Add-on_ button.
4. Select the extension's directory. The directory should contain all files from the extension folder in the [Handshake-Extension GitHub repository](https://github.com/NamebaseHQ/Handshake-Extension-Firefox).
5. Once the open dialog is submitted, a new extension should appear in the list. Press Ctrl+Shift+J - this will open console window.
6. In a regular Firefox tab, navigate to a resource in question (e.g. `turbomaze/`) - you will notice the console window is populated with lines. Select them and copy to clipboard, or use the context menu's _Save as_ command to produce a log file. Then submit the log along with your [GitHub issue](https://github.com/NamebaseHQ/Handshake-Extension-Firefox/issues/new)..

## Installing Server
You can run a local server by running the server code and changing `apiBase` in `common.js` to `"http://localhost:3000/"`.

**Reload existing local NHE extension, if installed, after changing `apiBase`!**
1. Install yarn
2. `cd` in to the server directory and `yarn install`
3. Run `npm start`

## TODO

- [ ] Remove server requirement
- [ ] Support recursive DNS aka subdomains
