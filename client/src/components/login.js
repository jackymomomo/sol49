import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase-config';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import '../scss/authform.scss';

function AuthForm() {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [deviceID, setDeviceID] = useState('');
    const [canSell, setCanSell] = useState(false);
    const [canBuy, setCanBuy] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = localStorage.getItem('rememberedEmail');
        const storedPassword = localStorage.getItem('rememberedPassword');
        if (storedEmail && storedPassword) {
            setEmail(storedEmail);
            setPassword(storedPassword);
            setRememberMe(true);
        }
    }, []);

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!canSell || !canBuy) {
            alert("Please confirm both 'Can you sell power?' and 'Can you buy power?' before signing up.");
            return;
        }
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name,
                email,
                address,
                phoneNumber,
                deviceID,
                canSell,
                canBuy
            });
            console.log('User profile created in Firestore');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating account:', error.message);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Signed in with email successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error signing in:', error.message);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log('Signed in with Google successfully');

            const userDocRef = doc(db, 'users', result.user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    email: result.user.email,
                    name: result.user.displayName,
                    address: null,
                    phoneNumber: null,
                    deviceID: null,
                });
                navigate('/additional-info', { state: { userId: result.user.uid } });
            } else if (!userDoc.data().address || !userDoc.data().phoneNumber || !userDoc.data().deviceID) {
                navigate('/additional-info', { state: { userId: result.user.uid } });
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error signing in with Google:', error.message);
        }
    };

    const handleRememberMe = () => {
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
        }
    };

    return (
        <div className="auth-form">
        <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
            <div className="form-container sign-up-container">
                <form onSubmit={handleSignUp}>
                    <h1>Create Account</h1>
                    <div className="social-container">
                        <button className="social" onClick={handleGoogleSignIn}>
                            <svg viewBox="0 0 256 262" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                    fill="#4285F4"
                                ></path>
                                <path
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                    fill="#34A853"
                                ></path>
                                <path
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                                    fill="#FBBC05"
                                ></path>
                                <path
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                    fill="#EB4335"
                                ></path>
                            </svg>
                            {/* Sign in with Google */}
                            </button>
                        </div>
                        <input className='createinput' type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                        <input className='createinput' type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className='createinput' type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <input className='createinput' type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
                        <input className='createinput' type="text" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                        <input className='createinput' type="text" placeholder="Device ID" value={deviceID} onChange={e => setDeviceID(e.target.value)} />
                        <div>
                            <input type="checkbox" checked={canSell} onChange={e => setCanSell(e.target.checked)} />
                            <label>Can you sell power?</label>
                        </div>
                        <div>
                            <input type="checkbox" checked={canBuy} onChange={e => setCanBuy(e.target.checked)} />
                            <label>Can you buy power?</label>
                        </div>
                        <button>Sign Up</button>
                    </form>
            </div>
            <div className="form-container sign-in-container">
                <form onSubmit={handleSignIn}>
                    <h1>Sign in</h1>
                    <div className="social-container">
                        <button className="social" onClick={handleGoogleSignIn}>
                            <svg viewBox="0 0 256 262" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                    fill="#4285F4"
                                ></path>
                                <path
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                    fill="#34A853"
                                ></path>
                                <path
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                                    fill="#FBBC05"
                                ></path>
                                <path
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                    fill="#EB4335"
                                ></path>
                            </svg>
                            {/* Sign in with Google */}
                        </button>                    </div>
                    <input className='logininput' type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input className='logininput' type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <a href="#">Forgot your password?</a>
                    <div className="custom-checkbox-container">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => {
                                    setRememberMe(e.target.checked);
                                    handleRememberMe();
                                }}
                            />
                            <label>Remember Me</label>
                        </div>
                    <button>Sign In</button>
                </form>
            </div>
            <div className="overlay-container">
                <div className="overlay">
                    < div className="overlay-panel overlay-left">
                        <h1 className='signupheader'>Welcome Back!</h1>
                        <p>Please login to see your passive income</p>
                        <button className="ghost" id="signIn" onClick={() => setIsRightPanelActive(false)}>Sign In</button>
                    </div>
                    <div className="overlay-panel overlay-right">
                        <h1 className='signupheader'>Hello, Friend!</h1>
                        <p>Start your sol49 journey</p>
                        <button className="ghost" id="signUp" onClick={() => setIsRightPanelActive(true)}>Sign Up</button>
                    </div>
                </div>
            </div>
        </div >
        </div>
    );
    }
    
    export default AuthForm;


