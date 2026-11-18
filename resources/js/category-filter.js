// Filtre par catégorie de la liste des articles : en mobile (sous lg), liste
// déroulante à la place des pastilles. Sans JS, les pastilles restent.
document.querySelectorAll('.category-filter').forEach((nav) => {
    const form   = nav.querySelector('.category-filter__form');
    const select = nav.querySelector('.category-filter__select');
    if (!form || !select) return;

    form.hidden = false;
    nav.classList.add('has-select');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        window.location.assign(select.value);
    });
});
