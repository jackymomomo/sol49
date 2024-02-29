import React, { useState} from 'react';
import { auth, googleProvider } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthForm.css';

function AuthForm() {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Account created successfully');
            // Handle successful account creation (e.g., redirect or show a success message)
        } catch (error) {
            console.error('Error creating account:', error.message);
            // Handle account creation errors
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Signed in with email successfully');
            // Handle successful sign-in
            navigate('/dashboard'); // Navigate to the dashboard
        } catch (error) {
            console.error('Error signing in:', error.message);
            // Handle sign-in errors
        }
    };

    // Example for the Google sign-in method
const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Signed in with Google successfully');
      navigate('/dashboard'); // Navigate to the dashboard
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };
  

    return (
        <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
            <div className="form-container sign-up-container">
                <form onSubmit={handleSignUp}>
                    <h1>Create Account</h1>
                    <div className="social-container">
                        {/* Social icons can go here or use for Google sign-in */}
                        <a href="#" onClick={handleGoogleSignIn} className="social"><i className="fab fa-google-plus-g"></i></a>
                    </div>
                    <span>or use your email for registration</span>
                    <input type="text" placeholder="Name" /> {/* This input can be used for additional user info */}
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button>Sign Up</button>
                </form>
            </div>
            <div className="form-container sign-in-container">
                <form onSubmit={handleSignIn}>
                    <h1>Sign in</h1>
                    <div className="social-container">
                        <a href="#" onClick={handleGoogleSignIn} className="social"><i className="fab fa-google-plus-g"></i></a>
                    </div>
                    <span>or use your account</span>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <a href="#">Forgot your password?</a>
                    <button>Sign In</button>
                </form>
            </div>
            <div className="overlay-container">
                <div className="overlay">
                    <div className="overlay-panel overlay-left">
                        <h1>Welcome Back!</h1>
                        <p>To keep connected with us please login with your personal info</p>
                        <button className="ghost" id="signIn" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
                    </div>
                    <div className="overlay-panel overlay-right">
                        <h1>Hello, Friend!</h1>
                        <p>Enter your personal details and start journey with us</p>
                        <button className="ghost" id="signUp" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthForm;
