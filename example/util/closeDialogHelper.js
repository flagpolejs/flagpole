const closeDialog = function (page, selector) {
    return new Promise((resolve, reject) => {

        // Timeout this entire block after 5 seconds.
        const timeout = setTimeout(() => reject(), 5000);

        // Accept our dialog and resolve the problem.
        const acceptDialog = (dialog) => {
            page.removeListener('dialog', acceptDialog);

            clearTimeout(timeout);

            dialog.accept();

            resolve();
        }

        // When a dialog appear for the page fire our callback.
        page.on('dialog', acceptDialog);

        // Clock our button.  Don't resolve until we see the dialog.
        page.click(selector)
        .catch((e) => reject(e));
    })
}

exports.closeDialog = closeDialog;
