(() => {
  const tiles = document.querySelectorAll('.about-path');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  }));
  tiles.forEach(tile => {
    observer.observe(tile);
    if (tile.dataset.aboutGallery) tile.addEventListener('click', event => {
      event.preventDefault(); openGallery(tile.dataset.aboutGallery);
    });
  });
})();
