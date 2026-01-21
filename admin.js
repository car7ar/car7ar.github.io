// قائمة بريد المسؤولين المصرح لهم
const ADMIN_EMAILS = [
    'admin@realmadrid.com',
    'admin@example.com',
    'admin@cr7.com',
    // يمكن إضافة المزيد من المسؤولين هنا
];

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwk9nj-PBU7K6BRIwde2gaiTsm-LcGxoE",
    authDomain: "car7ps.firebaseapp.com",
    projectId: "car7ps",
    storageBucket: "car7ps.firebasestorage.app",
    messagingSenderId: "196399922356",
    appId: "1:196399922356:web:f234ab0c42ddb3998f6be1",
    measurementId: "G-R7PN3FNPHT"
};

let auth = null;
 
// تهيئة Firebase
try {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        console.log('Firebase initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// عناصر الصفحة
const loginForm = document.getElementById('adminLoginForm');
const emailInput = document.getElementById('adminEmail');
const passwordInput = document.getElementById('adminPassword');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const btnText = loginBtn.querySelector('.btn-text');
const btnLoader = loginBtn.querySelector('.btn-loader');

// دالة للتحقق من أن المستخدم مسؤول
function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// دالة لعرض رسالة خطأ
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// دالة لتغيير حالة زر التحميل
function setLoading(loading) {
    if (loading) {
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
    } else {
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// دالة تسجيل الدخول
async function handleAdminLogin(email, password) {
    // التحقق من أن البريد في قائمة المسؤولين
    if (!isAdminEmail(email)) {
        showError('عذراً، هذا البريد الإلكتروني غير مصرح له بالوصول إلى لوحة التحكم');
        return;
    }

    setLoading(true);

    try {
        // محاولة تسجيل الدخول عبر Firebase
        if (auth) {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // التحقق مرة أخرى من صلاحيات المسؤول
            if (isAdminEmail(user.email)) {
                // حفظ حالة المسؤول في localStorage
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminEmail', user.email);

                // إعادة التوجيه إلى لوحة التحكم
                window.location.href = 'admin-dashboard.html';
            } else {
                // تسجيل الخروج إذا لم يكن مسؤولاً
                await auth.signOut();
                showError('عذراً، ليس لديك صلاحيات للوصول إلى لوحة التحكم');
            }
        } else {
            // في حالة عدم توفر Firebase، استخدام تسجيل دخول وهمي للتطوير
            console.warn('Firebase not available, using demo mode');

            // للتطوير فقط: قبول أي كلمة مرور للبريد المسؤول
            if (password.length >= 6) {
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminEmail', email);
                window.location.href = 'admin-dashboard.html';
            } else {
                showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            }
        }
    } catch (error) {
        console.error('Login error:', error);

        // رسائل خطأ مخصصة
        let errorMsg = 'حدث خطأ أثناء تسجيل الدخول';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMsg = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/user-disabled':
                errorMsg = 'هذا الحساب معطل';
                break;
            case 'auth/user-not-found':
                errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/wrong-password':
                errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'تم تجاوز عدد المحاولات المسموحة، يرجى المحاولة لاحقاً';
                break;
            case 'auth/network-request-failed':
                errorMsg = 'خطأ في الاتصال بالشبكة';
                break;
        }

        showError(errorMsg);
    } finally {
        setLoading(false);
    }
}

// معالج إرسال النموذج
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // التحقق من الحقول
    if (!email || !password) {
        showError('يرجى ملء جميع الحقول');
        return;
    }

    await handleAdminLogin(email, password);
});

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // إذا كان المستخدم مسجل دخول بالفعل كمسؤول، إعادة توجيه
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user && isAdminEmail(user.email)) {
                window.location.href = 'admin-dashboard.html';
            }
        });
    } else {
        // في وضع التطوير، التحقق من localStorage
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin === 'true') {
            window.location.href = 'admin-dashboard.html';
        }
    }
});
