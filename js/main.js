document.documentElement.classList.add('js');

    /* ── Typewriter ── */
    const roles = [
      'Full-Stack Developer',
      'Frontend Developer',
      'React & Next.js Dev',
      'UI/UX Implementer',
      'AI Tools Builder',
    ];
    let ri = 0, ci = 0, deleting = false;
    const roleEl = document.getElementById('role-text');

    function typeLoop() {
      const word = roles[ri];
      if (!deleting) {
        roleEl.textContent = word.slice(0, ++ci);
        if (ci === word.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
      } else {
        roleEl.textContent = word.slice(0, --ci);
        if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
      }
      setTimeout(typeLoop, deleting ? 45 : 80);
    }
    typeLoop();

    /* ── Active nav ── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__links a');
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const m = document.querySelector(`.nav__links a[href="#${e.target.id}"]`);
          if (m) m.classList.add('active');
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    sections.forEach(s => secObs.observe(s));

    /* ── Hamburger ── */
    const burger = document.getElementById('burger');
    const drawer = document.getElementById('drawer');
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.drawer-link').forEach(l => {
      l.addEventListener('click', () => {
        burger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    /* ── Scroll reveal + skill bars ── */
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal, .skill-block').forEach(el => revObs.observe(el));

    /* ── Project thumbnails: show placeholder only when the image fails ── */
    document.querySelectorAll('.project-card__thumb').forEach(thumb => {
      const img = thumb.querySelector('img');
      const ph = thumb.querySelector('.project-card__ph');
      if (!img || !ph) return;
      const showImg = () => { img.style.display = ''; ph.style.display = 'none'; };
      const showPh = () => { img.style.display = 'none'; ph.style.display = ''; };
      img.addEventListener('load', showImg);
      img.addEventListener('error', showPh);
      if (img.complete) {
        if (img.naturalWidth > 0) showImg(); else showPh();
      }
    });

    /* ── Contact form (FormSubmit.co — free, no IP lock) ── */
    const FORM_ENDPOINT = 'https://formsubmit.co/ajax/shaikhraheman295ltr@gmail.com';

    const contactForm = document.getElementById('contact-form-wrap');
    const thanksEl = document.getElementById('thanks');
    const errorEl = document.getElementById('form-error');
    const submitBtn = contactForm.querySelector('.form-submit');

    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }

      const name = document.getElementById('c-name').value.trim();
      const email = document.getElementById('c-email').value.trim();
      const type = document.getElementById('c-type').value;
      const message = document.getElementById('c-msg').value.trim();
      const subject = type ? `${type} — via AR.DEV portfolio` : 'Portfolio inquiry';

      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('email', email);
        fd.append('_subject', subject);
        fd.append('message', message);
        fd.append('_template', 'table');
        fd.append('_captcha', 'false');

        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: fd,
        });
        const data = await res.json();
        const ok = data && (data.success === true || data.success === 'true');
        if (ok) {
          contactForm.reset();
          showThanks();
        } else {
          throw new Error(data && data.message ? data.message : 'Request failed');
        }
      } catch (err) {
        errorEl.textContent = 'Something went wrong — please email me directly at shaikhraheman295ltr@gmail.com.';
        errorEl.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message →';
      }
    });

    function showThanks() {
      contactForm.style.display = 'none';
      errorEl.style.display = 'none';
      thanksEl.style.display = 'block';
    }