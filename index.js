const models = ['pizzaEntity', 'burgerEntity'];
  let currentIndex = 0;

  function showModel(index) {
    models.forEach((id, i) => {
      document.getElementById(id).setAttribute('visible', i === index);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');

    scene.addEventListener('loaded', () => {
      const next = document.querySelector('#nextArrow');
      const prev = document.querySelector('#prevArrow');

      next.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % models.length;
        console.log('Current Index:', currentIndex);
        showModel(currentIndex);
      });

      prev.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + models.length) % models.length;
        showModel(currentIndex);
      });
    });
  });