const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealElements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('visible'));
}

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  if (!button) return;

  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('active');

    faqItems.forEach((faqItem) => {
      faqItem.classList.remove('active');
      const question = faqItem.querySelector('.faq-question');
      if (question) {
        question.setAttribute('aria-expanded', 'false');
      }
    });

    if (!isOpen) {
      item.classList.add('active');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

function setFormStatus(form, message, type = 'success') {
  const status = form.querySelector('.form-status');
  if (!status) return;

  status.textContent = message;
  status.classList.remove('success', 'error');
  status.classList.add(type);
}

function saveFormSubmission(key, payload) {
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(payload);
    localStorage.setItem(key, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('Unable to save to localStorage:', error);
    return false;
  }
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const subject = String(formData.get('subject') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !phone || !subject || !message) {
      setFormStatus(contactForm, 'Please complete all fields before sending your message.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      setFormStatus(contactForm, 'Please provide a valid email address.', 'error');
      return;
    }

    const saved = saveFormSubmission('profix_contact', {
      name,
      email,
      phone,
      subject,
      message,
      createdAt: new Date().toISOString()
    });

    if (!saved) {
      setFormStatus(contactForm, 'Something went wrong while saving your message. Please try again.', 'error');
      return;
    }

    contactForm.reset();
    setFormStatus(contactForm, 'Thanks! Your message has been received and saved locally for this demo.', 'success');
  });
}

const bookingForm = document.querySelector('#booking-form');

if (bookingForm) {
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const service = String(formData.get('service') || '').trim();
    const date = String(formData.get('date') || '').trim();
    const time = String(formData.get('time') || '').trim();
    const address = String(formData.get('address') || '').trim();
    const details = String(formData.get('details') || '').trim();

    if (!name || !email || !phone || !service || !date || !time || !address || !details) {
      setFormStatus(bookingForm, 'Please complete every field before submitting your request.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      setFormStatus(bookingForm, 'Please provide a valid email address.', 'error');
      return;
    }

    if (details.length < 10) {
      setFormStatus(bookingForm, 'Please add a few more details so we understand the request.', 'error');
      return;
    }

    const saved = saveFormSubmission('profix_booking', {
      name,
      email,
      phone,
      service,
      date,
      time,
      address,
      details,
      createdAt: new Date().toISOString()
    });

    if (!saved) {
      setFormStatus(bookingForm, 'Something went wrong while saving your booking request. Please try again.', 'error');
      return;
    }

    bookingForm.reset();
    setFormStatus(bookingForm, 'Request submitted successfully! We will follow up with scheduling details soon.', 'success');
  });
}
