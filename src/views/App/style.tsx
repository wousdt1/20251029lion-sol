import styled from "styled-components";
import bg_png from '../../assets/bg.png'

export const AppPage = styled.body`
 /* 全局样式 */
 :root {
   --primary: #9945FF;
   --secondary: #14F195;
   --dark: #0F0F0F;
   --light: #FFFFFF;
   --gray: #888888;
 }


 .container {
   max-width: 1200px;
   margin: 0 auto;
   padding: 0 20px;
 }

 /* 头部样式 */
 header {
   background: linear-gradient(90deg, var(--dark), #1a1a1a);
   padding: 20px 0;
   position: sticky;
   top: 0;
   z-index: 100;
   box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
 }

 .header-container {
   display: flex;
   justify-content: space-between;
   align-items: center;
 }

 .logo {
   display: flex;
   align-items: center;
   gap: 12px;
   font-size: 1.5rem;
   font-weight: 700;
   color: var(--secondary);
 }

 .logo span {
   color: var(--primary);
 }

 .nav-links {
   display: flex;
   gap: 30px;
 }

 .nav-links a {
   color: var(--light);
   text-decoration: none;
   font-weight: 500;
   transition: color 0.3s;
   position: relative;
 }

 .nav-links a:hover {
   color: var(--secondary);
 }

 .nav-links a::after {
   content: '';
   position: absolute;
   bottom: -5px;
   left: 0;
   width: 0;
   height: 2px;
   background: var(--secondary);
   transition: width 0.3s;
 }

 .nav-links a:hover::after {
   width: 100%;
 }

 .cta-button {
   background: linear-gradient(90deg, var(--primary), #6c1eff);
   /* color: white; */
   border: none;
   padding: 12px 24px;
   border-radius: 8px;
   font-weight: 600;
   cursor: pointer;
   transition: all 0.3s;
   box-shadow: 0 4px 15px rgba(153, 69, 255, 0.3);
 }

 .cta-button:hover {
   transform: translateY(-3px);
   box-shadow: 0 6px 20px rgba(153, 69, 255, 0.5);
 }

 /* 英雄区域 */
 .hero {
   padding: 100px 0;
   background: radial-gradient(circle at top right, #1a1a1a, var(--dark));
   position: relative;
   overflow: hidden;
 }

 .hero::before {
   content: '';
   position: absolute;
   top: -50%;
   left: -50%;
   width: 200%;
   height: 200%;
   background: radial-gradient(circle, rgba(153, 69, 255, 0.1) 0%, transparent 70%);
   z-index: 0;
 }

 .hero-content {
   position: relative;
   z-index: 1;
   max-width: 650px;
 }

 .hero h1 {
   font-size: 3.5rem;
   line-height: 1.1;
   margin-bottom: 24px;
   background: linear-gradient(90deg, var(--light), var(--secondary));

 }

 .hero p {
   font-size: 1.25rem;
   color: var(--gray);
   margin-bottom: 40px;
   max-width: 550px;
 }

 .hero-buttons {
   display: flex;
   gap: 20px;
   margin-top: 30px;
 }

 .secondary-button {
   background: transparent;
   color: var(--light);
   border: 2px solid var(--primary);
   padding: 12px 24px;
   border-radius: 8px;
   font-weight: 600;
   cursor: pointer;
   transition: all 0.3s;
 }

 .secondary-button:hover {
   background: rgba(153, 69, 255, 0.1);
 }

 /* 功能部分 */
 .features {
   padding: 10px 0;
   /* background-color: #0d0d0d; */
 }

 .section-header {
   text-align: center;
   margin-bottom: 70px;
 }

 .section-header h2 {
   font-size: 2.5rem;
   margin-bottom: 20px;
   background: linear-gradient(90deg, var(--primary), var(--secondary));

 }

 .section-header p {
   color: var(--gray);
   max-width: 600px;
   margin: 0 auto;
 }

 .features-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
   gap: 30px;
 }

 .feature-card {
   
   border-radius: 16px;
   padding: 30px;
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   transition: transform 0.3s;
   border: 1px solid rgba(255, 255, 255, 0.05);

   svg {
     color: #00d06c;
   }
 }

 .feature-card:hover {
   transform: translateY(-10px);
   border-color: rgba(153, 69, 255, 0.3);
 }

 .feature-icon {
   width: 60px;
   height: 60px;
   background: linear-gradient(135deg, var(--primary), #6c1eff);
   border-radius: 12px;
   display: flex;
   align-items: center;
   justify-content: center;
   margin-bottom: 20px;
 }

 .feature-card h3 {
   font-size: 1.5rem;
   margin-bottom: 15px;
   color: var(--light);
 }

 .feature-card p {
   color: var(--gray);
 }

 /* 优势部分 */
 .benefits {
   padding: 100px 0;
   background: radial-gradient(circle at bottom left, #1a1a1a, var(--dark));
 }

 .benefits-content {
   display: flex;
   gap: 50px;
   align-items: center;
 }

 .benefits-text {
   flex: 1;
 }

 .benefits-text h2 {
   font-size: 2.5rem;
   margin-bottom: 30px;
   background: linear-gradient(90deg, var(--secondary), #00d06c);

 }

 .benefit-item {
   display: flex;
   gap: 15px;
   margin-bottom: 25px;
 }

 .benefit-icon {
   color: var(--secondary);
   flex-shrink: 0;
 }

 .benefit-text h3 {
   color: var(--light);
   margin-bottom: 8px;
 }

 .benefit-text p {
   color: var(--gray);
 }

 .benefits-visual {
   flex: 1;
   position: relative;
   height: 400px;
   background: linear-gradient(145deg, #1a1a1a, #0f0f0f);
   border-radius: 16px;
   display: flex;
   align-items: center;
   justify-content: center;
   overflow: hidden;
   box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
 }

 /* CTA部分 */
 .cta-section {
   padding: 20px 0;
   background: linear-gradient(135deg, var(--primary), #6c1eff);
   text-align: center;
 }

 .cta-section h2 {
   font-size: 2.8rem;
   margin-bottom: 20px;
 }

 .cta-section p {
   font-size: 1.2rem;
   max-width: 700px;
   margin: 0 auto 40px;
   opacity: 0.9;
 }

 /* 底部区域 */
 footer {
   /* background-color: #0a0a0a; */
   padding: 20px 0 30px;
 }

 .footer-content {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
   gap: 40px;
   margin-bottom: 50px;
 }

 .footer-logo {
   font-size: 1.8rem;
   font-weight: 700;
   margin-bottom: 20px;
   color: var(--secondary);
 }

 .footer-logo span {
   color: var(--primary);
 }

 .footer-about p {
   color: var(--gray);
   margin-bottom: 20px;
 }

 .social-links {
   display: flex;
   gap: 15px;
 }

 .social-icon {
   width: 40px;
   height: 40px;
   border-radius: 50%;
   background: #1a1a1a;
   display: flex;
   align-items: center;
   justify-content: center;
   transition: all 0.3s;
 }

 .social-icon:hover {
   background: var(--primary);
   transform: translateY(-3px);
 }

 .footer-links h3 {
   color: var(--light);
   margin-bottom: 25px;
   font-size: 1.2rem;
 }

 .footer-links ul {
   list-style: none;
 }

 .footer-links li {
   margin-bottom: 15px;
 }

 .footer-links a {
   color: var(--gray);
   text-decoration: none;
   transition: color 0.3s;
 }

 .footer-links a:hover {
   color: var(--secondary);
 }

 .copyright {
   text-align: center;
   padding-top: 30px;
   border-top: 1px solid rgba(255, 255, 255, 0.05);
   color: var(--gray);
 }

 /* 响应式设计 */
 @media (max-width: 992px) {
   .hero h1 {
     font-size: 2.8rem;
   }

   .benefits-content {
     flex-direction: column;
   }
 }

 @media (max-width: 768px) {
   .header-container {
     flex-direction: column;
     gap: 20px;
   }

   .hero h1 {
     font-size: 2.3rem;
   }

   .hero-buttons {
     flex-direction: column;
   }

   .hero {
     padding: 70px 0;
   }

   .features,
   .benefits,
   .cta-section {
     padding: 20px 0;
   }
 }

 @media (max-width: 576px) {
   .nav-links {
     flex-wrap: wrap;
     justify-content: center;
   }

   .hero h1 {
     font-size: 2rem;
   }
 }
`

