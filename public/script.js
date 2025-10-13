  // Dark Mode Toggle
    const darkModeToggle = document.getElementById('toggle');
    const root = document.documentElement;
    let dashboardImg = document.getElementsByClassName('dashboard-preview');
    if (localStorage.getItem('theme') === 'dark') {
      root.setAttribute('data-theme', 'dark');
      darkModeToggle.checked = true;
      dashboardImg.srcObject= "autopost-dashboard-dark,jpg";
    }

    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      dashboardImg.srcObject= "autopost-dashboard-dark,jpg";
      } else {
        root.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    });
