import { useNavigate } from 'react-router-dom'
import {
  AppPage,
} from './style'


function App() {

  const navigate = useNavigate()

  return (
    <AppPage>

      {/* <!-- 英雄区域 --> */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>一键创建您的Solana SPL代币</h1>
            <p>无需编程知识，5分钟内创建属于您的Solana代币。支持PumpFun开盘、燃烧流动性、批量空投及做市机器人，助您轻松打造成功项目。</p>
            <div className="hero-buttons">
              <button className="cta-button" onClick={() => navigate('/token/create')}>立即创建代币</button>
              <button className="secondary-button">
                <a href="https://www.youtube.com/liontool" target="_blank" rel="noreferrer" title='视频教程'>
                  观看演示视频
                </a>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* <!-- 功能特点 --> */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>强大功能，简化代币创建</h2>
            <p>LionTool提供一站式Solana代币解决方案，从创建到营销全方位支持</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                </svg>
              </div>
              <h3>一键创建SPL代币</h3>
              <p>无需任何编程知识，简单填写信息即可在Solana区块链上创建您的专属代币。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h3>PumpFun开盘支持</h3>
              <p>无缝对接PumpFun平台，实现代币开盘自动化，快速启动您的代币项目。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M17 3H7C4.8 3 3 4.8 3 7V17C3 19.2 4.8 21 7 21H17C19.2 21 21 19.2 21 17V7C21 4.8 19.2 3 17 3ZM12 18C8.7 18 6 15.3 6 12C6 8.7 8.7 6 12 6C15.3 6 18 8.7 18 12C18 15.3 15.3 18 12 18Z" />
                </svg>
              </div>
              <h3>燃烧流动性</h3>
              <p>通过燃烧流动性机制提高代币稀缺性，增强投资者信心，推动代币价值增长。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M12 1L21 5V11C21 16.55 17.16 21.74 12 23C6.84 21.74 3 16.55 3 11V5L12 1ZM12 11H15V13H12V16H10V13H7V11H10V8H12V11Z" />
                </svg>
              </div>
              <h3>批量空投</h3>
              <p>支持向数千个钱包地址同时空投代币，高效完成社区建设和代币分发。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M20 9V7C20 5.9 19.1 5 18 5H6C4.9 5 4 5.9 4 7V9C2.9 9 2 9.9 2 11V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V11C22 9.9 21.1 9 20 9ZM6 7H18V9H6V7ZM20 19H4V11H20V19Z" />
                </svg>
              </div>
              <h3>做市机器人</h3>
              <p>智能做市机器人自动管理流动性，维持代币价格稳定，防止剧烈波动。</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#1676fc">
                  <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15ZM17 3H7C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V5C19 3.9 18.1 3 17 3ZM17 19H7V5H17V19Z" />
                </svg>
              </div>
              <h3>代币权限控制</h3>
              <p>灵活设置代币权限，包括铸造、冻结和关闭权限，全面掌控您的代币生态。</p>
            </div>
          </div>
        </div>
      </section>

      {/* <!-- 平台优势 --> */}
      <section id="benefits" className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>为什么选择LionTool？</h2>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#14F195">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>简单易用</h3>
                  <p>无需编程知识，直观的用户界面让代币创建变得简单</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#14F195">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>成本效益</h3>
                  <p>相比传统开发，节省90%以上的时间和成本</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#14F195">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>全面功能</h3>
                  <p>从创建到营销，一站式解决所有代币相关需求</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#14F195">
                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" />
                  </svg>
                </div>
                <div className="benefit-text">
                  <h3>安全可靠</h3>
                  <p>基于Solana区块链的安全保障，智能合约经过严格审计</p>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <svg width="300" height="300" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="#9945FF" opacity="0.2" />
                <circle cx="100" cy="100" r="60" fill="#14F195" opacity="0.2" />
                <circle cx="100" cy="100" r="40" fill="#9945FF" opacity="0.4" />
                <circle cx="100" cy="100" r="20" fill="#14F195" opacity="0.6" />
                <text x="100" y="100" text-anchor="middle" fill="#1676fc" font-size="20" font-weight="bold">SOL</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* <!-- CTA区域 --> */}
      <section className="cta-section">
        <div className="container">
          <h2>准备好创建您的Solana代币了吗？</h2>
          <p>加入数千名成功项目创建者的行列，立即启动您的代币项目</p>
          <button className="cta-button"
            style={{ background: 'white', color: 'var(--primary)' }}>立即开始</button>
        </div>
      </section>

      {/* <!-- 页脚 --> */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-about">
              <div className="footer-logo">
                Lion<span>Tool</span>
              </div>
              <p>领先的Solana代币创建与管理平台，提供一站式解决方案，助您轻松打造成功的区块链项目。</p>
              <div className="social-links">

                <a href="https://x.com/Lion_Tool" className="social-icon" target="_blank" rel="noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1676fc">
                    <path d="M22.46 6C21.69 6.35 20.86 6.58 20 6.69C20.88 6.16 21.56 5.32 21.88 4.31C21.05 4.81 20.13 5.16 19.16 5.36C18.37 4.5 17.26 4 16 4C13.65 4 11.73 5.92 11.73 8.29C11.73 8.63 11.77 8.96 11.84 9.27C8.28 9.09 5.11 7.38 3 4.79C2.63 5.42 2.42 6.16 2.42 6.94C2.42 8.43 3.17 9.75 4.33 10.5C3.62 10.5 2.96 10.3 2.38 10C2.38 10 2.38 10 2.38 10.03C2.38 12.11 3.86 13.85 5.82 14.24C5.46 14.34 5.08 14.39 4.69 14.39C4.42 14.39 4.15 14.36 3.89 14.31C4.43 16 6 17.26 7.89 17.29C6.43 18.45 4.58 19.13 2.56 19.13C2.22 19.13 1.88 19.11 1.54 19.07C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79C20.33 8.6 20.33 8.42 20.32 8.23C21.16 7.63 21.88 6.87 22.46 6Z" />
                  </svg>
                </a>
                <a href="https://github.com/LionToolcc/LionToolcc" className="social-icon" target="_blank" rel="noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1676fc">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21V19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26V21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" />
                  </svg>
                </a>
                <a href="https://t.me/LionToolcc" className="social-icon" target="_blank" rel="noreferrer">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1676fc">
                    <path d="M19.615 3.184C17.895 2.452 16.022 2.003 14.057 2C9.478 2 6 5.589 6 10.253C6 11.847 6.526 13.322 7.422 14.5C7.422 14.5 6.825 20.373 6.247 22.28C6.11 22.728 6.401 23 6.79 23C7.42 23 12.38 19.05 12.38 19.05L12.5 19.07C14.171 19.07 15.75 18.551 17.036 17.65C18.796 19.49 21.212 20.63 23.89 20.63C23.94 20.63 23.99 20.63 24.04 20.63C24.33 20.63 24.58 20.4 24.58 20.05C24.58 17.77 23.83 15.67 22.57 13.97C24.21 12.25 25.31 9.95 25.31 7.4C25.31 5.55 24.79 3.83 23.86 2.33C22.73 2.54 21.59 2.91 20.52 3.43L19.615 3.184Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h3>产品</h3>
              <ul>
                <li><a href="/token/create" title='创建代币'>创建代币</a></li>
                <li><a href="/tool/multisend" title='批量空投'>批量空投</a></li>
                <li><a href="/swapbot" title='做市机器人'>做市机器人</a></li>
                <li><a href="/token/revokeAuthority" title='权限管理'>权限管理</a></li>
                <li><a href="/token/burn" title='燃烧流动性'>燃烧流动性</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h3>资源</h3>
              <ul>
                <li><a href="https://help.liontool.cc/" target='_blank' title='文档中心'>文档中心</a></li>
                <li><a href="https://www.youtube.com/liontool" target="_blank" rel="noreferrer" title='视频教程'>视频教程</a></li>
                <li><a href="#">API接口</a></li>
                <li><a href="#">博客</a></li>
                <li><a href="https://t.me/LionToolcc" target="_blank" rel="noreferrer">社区</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h3>公司</h3>
              <ul>
                <li><a href="#">关于我们</a></li>
                <li><a href="https://t.me/LionToolcc" target="_blank" rel="noreferrer">联系我们</a></li>
                <li><a href="#">服务条款</a></li>
                <li><a href="#">隐私政策</a></li>
                <li><a href="#">合作伙伴</a></li>
              </ul>
            </div>
          </div>

        </div>
      </footer>
    </AppPage>
  )
}

export default App