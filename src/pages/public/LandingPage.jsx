import React, { useState, useMemo } from "react";
import { Container, Row, Col, Accordion, Form, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaHardHat, FaTools, FaBuilding, FaMoneyCheckAlt, FaShieldAlt, FaCheckCircle,
  FaArrowRight, FaUserShield, FaProjectDiagram, FaUsers, FaFileContract,
  FaChartLine, FaBell, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTwitter,
  FaLinkedin, FaGithub, FaQuestionCircle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const B = {
  primary: "#1B4F72", mid: "#2E86C1", dark: "#154360",
  light: "#AED6F1",  soft: "#EAF4FB", glow: "rgba(27,79,114,0.15)",
  accent: "#38BDF8", text: "#1A2B3C", muted: "#64748B",
  surface: "#FFFFFF", alt: "#F5F8FA", border: "#D6E4F0",
};

const fadeUp = { hidden:{opacity:0,y:24}, visible:{opacity:1,y:0,transition:{duration:0.5,ease:"easeOut"}} };
const stagger = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:0.07}} };

const MODULES = [
  { name:"Identity & Access Management",    actor:"Admin",                  icon:FaUserShield,    accent:"#475569", desc:"Manage authentication, role-based access, and audit trails.",        features:["RBAC for 6 user roles","Encrypted credentials","Audit logging"] },
  { name:"Project Planning & Scheduling",   actor:"Project Manager",         icon:FaProjectDiagram,accent:B.primary, desc:"Define project plans, milestones, and timelines.",                   features:["Project plans","Milestone tracking","Timeline visualization"] },
  { name:"Resource Allocation & Workforce", actor:"Project Manager",         icon:FaUsers,         accent:"#4F46E5", desc:"Assign people and equipment to every task at the right time.",       features:["Workforce assignment","Equipment tracking","Capacity planning"] },
  { name:"Site Operations & Progress",      actor:"Site Engineer",           icon:FaHardHat,       accent:"#D97706", desc:"Daily logs, progress updates, and issue reporting.",                 features:["Daily site logs","Progress updates","Issue reporting"] },
  { name:"Safety & Compliance",             actor:"Safety Officer",          icon:FaShieldAlt,     accent:"#DC2626", desc:"Inspections, compliance tracking, and incident reporting.",          features:["Inspections","Compliance tracking","Incident reporting"] },
  { name:"Vendor & Contract Management",    actor:"Vendor / Contractor",     icon:FaFileContract,  accent:"#0D9488", desc:"Contracts, deliveries, and invoices from start to settlement.",      features:["Contracts","Deliveries","Invoices"] },
  { name:"Financials & Budget Control",     actor:"Finance Officer",         icon:FaMoneyCheckAlt, accent:"#16A34A", desc:"Track expenses, reconcile budgets, and process payments.",           features:["Expense tracking","Budget reconciliation","Payments"] },
  { name:"Reporting & Analytics",           actor:"Project Manager / Admin", icon:FaChartLine,     accent:B.mid,     desc:"Real-time dashboards for projects, resources, safety, finance.",    features:["Project dashboards","Resource & safety reports","Finance analytics"] },
  { name:"Notifications & Alerts",          actor:"All roles",               icon:FaBell,          accent:"#DB2777", desc:"Proactive alerts on delays, incidents, and budget overruns.",        features:["Delay alerts","Incident alerts","Budget-overrun alerts"] },
];

const WORKFLOW = [
  { title:"Plan & Schedule",  desc:"Define projects, set milestones, assign tasks, allocate resources, and draft budgets.",                      icon:FaProjectDiagram },
  { title:"Execute & Build",  desc:"Engineers log daily activities; vendors deliver materials; safety officers run inspections.",                  icon:FaHardHat },
  { title:"Monitor & Report", desc:"Real-time dashboards on progress variance, safety compliance, and budget variance.",                          icon:FaChartLine },
];

const TEAM     = ["Yogananda J","Rohan K R","Rohit Surya","Sakshi Sharma","Rashmi S","Tamil Selvam","Sachin","Sunil"];
const FAQS     = [
  { q:"Is there a free trial?",             a:"Yes — full access to core modules, no credit card required." },
  { q:"What roles does BuildSmart support?", a:"Six roles: Admin, Project Manager, Site Engineer, Safety Officer, Finance Officer, and Vendor/Contractor." },
  { q:"How is our data kept secure?",        a:"256-bit AES encryption, optional MFA, and a complete audit log of every action." },
  { q:"Do you offer ERP integrations?",      a:"ERP and payment-gateway connectors are on the roadmap for upcoming releases." },
];
const SUBJECTS = ["General enquiry","Sales","Demo request","Support"];

const PALETTE   = [B.primary,B.mid,B.dark,"#0E7490",B.accent,"#4F46E5","#16A34A","#DB2777"];
const nameColor = n => { let h=0; for(let i=0;i<n.length;i++) h=(h*31+n.charCodeAt(i))>>>0; return PALETTE[h%PALETTE.length]; };
const initials  = n => n.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase();

/* ── Root ── */
const LandingPage = () => {
  const [step, setStep] = useState(0);
  return (
    <div style={{ background:B.surface, color:B.text, overflowX:"hidden" }}>
      <Styles />
      <Hero />
      <Services />
      <Workflow step={step} setStep={setStep} />
      <ContactSection />
      <Team />
      <FAQ />
      <CTABand />
    </div>
  );
};

/* ── Styles — zero hardcoded spacing, Bootstrap utilities drive layout ── */
const Styles = () => (
  <style>{`
    .lp-alt { background: ${B.alt}; }

    .lp-chip {
      display:inline-flex; align-items:center; gap:.4rem;
      background:${B.soft}; color:${B.dark};
      padding:.28rem .8rem; border-radius:999px;
      font-size:.7rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    }

    /* Hero — Bootstrap pt-5 handles navbar offset via PublicLayout fixed-top */
    .lp-hero { overflow:hidden; background:#fff; }
    .lp-tag {
      font-size:.75rem; color:${B.muted}; line-height:1.4;
      min-width:105px; flex-shrink:0; text-align:right;
    }
    .lp-tag strong { color:${B.text}; }
    .lp-h1 {
      font-size:clamp(2.6rem,7vw,5.6rem);
      font-weight:900; letter-spacing:-.04em; line-height:1; color:${B.text}; margin:0;
    }
    .lp-h1 .hl { color:${B.accent}; }
    .lp-sub {
      font-size:.87rem; color:${B.muted}; line-height:1.6; max-width:230px; flex-shrink:0;
    }
    .lp-img-wrap { border-radius:16px 16px 0 0; overflow:hidden; line-height:0; }
    .lp-img { width:100%; display:block; object-fit:cover; max-height:500px; }

    .lp-h2   { font-size:clamp(1.55rem,3vw,2.25rem); font-weight:800; letter-spacing:-.03em; color:${B.text}; }
    .lp-lead { color:${B.muted}; font-size:1rem; line-height:1.65; }
    .lp-label{ color:${B.muted}; font-size:.7rem; font-weight:700; letter-spacing:.09em; text-transform:uppercase; }

    .lp-card {
      background:#fff; border:1px solid ${B.border}; border-radius:16px;
      padding:1.5rem; height:100%; transition:all .22s ease;
    }
    .lp-card:hover { transform:translateY(-4px); box-shadow:0 14px 32px rgba(27,79,114,.09); border-color:${B.light}; }
    .lp-icon {
      width:44px; height:44px; border-radius:12px;
      display:inline-flex; align-items:center; justify-content:center;
      font-size:1.1rem; margin-bottom:.8rem;
    }
    .lp-flist { list-style:none; padding:0; margin:.75rem 0 0; }
    .lp-flist li { display:flex; align-items:center; gap:.45rem; color:${B.muted}; font-size:.84rem; padding:.18rem 0; }
    .lp-flist li::before { content:""; width:5px; height:5px; border-radius:50%; background:${B.mid}; flex-shrink:0; }

    .lp-step {
      background:#fff; border:1.5px solid ${B.border};
      border-radius:14px; padding:1.25rem; cursor:pointer; transition:all .22s ease;
    }
    .lp-step:hover { border-color:${B.mid}; }
    .lp-step.on {
      background:linear-gradient(135deg,${B.primary},${B.mid});
      border-color:${B.primary}; color:#fff; box-shadow:0 10px 24px ${B.glow};
    }
    .lp-step.on .lp-step-desc { color:rgba(255,255,255,.88); }
    .lp-step-num   { font-size:.72rem; font-weight:800; opacity:.6; letter-spacing:.1em; }
    .lp-step-title { font-weight:700; font-size:1.1rem; margin:.2rem 0 .4rem; }
    .lp-step-desc  { color:${B.muted}; font-size:.875rem; line-height:1.5; }
    .lp-viz {
      background:#fff; border-radius:16px;
      box-shadow:0 14px 40px rgba(27,79,114,.08);
      padding:2rem; min-height:340px;
      display:flex; align-items:center; justify-content:center;
      border:1px solid ${B.border};
    }
    .lp-pill {
      background:${B.soft}; color:${B.dark};
      padding:.4rem .85rem; border-radius:999px; font-weight:600; font-size:.82rem;
    }

    .lp-contact-info { background:${B.soft}; border-radius:20px; padding:2rem; height:100%; border:1px solid ${B.light}; }
    .lp-contact-row  { display:flex; align-items:center; gap:.9rem; padding:.65rem 0; }
    .lp-contact-row .lp-icon { width:38px; height:38px; margin:0; background:#fff; color:${B.primary}; box-shadow:0 2px 6px rgba(27,79,114,.1); }
    .lp-form-wrap {
      background:#fff; border:1px solid ${B.border};
      border-radius:20px; padding:2rem; box-shadow:0 4px 18px rgba(27,79,114,.04);
    }
    .lp-form-wrap .form-control,
    .lp-form-wrap .form-select { border-radius:10px; border-color:${B.border}; padding:.65rem .85rem; font-size:.9rem; }
    .lp-form-wrap .form-control:focus,
    .lp-form-wrap .form-select:focus { border-color:${B.mid} !important; box-shadow:0 0 0 .18rem rgba(46,134,193,.2) !important; }
    .lp-social {
      width:34px; height:34px; border-radius:50%;
      background:#fff; color:${B.primary};
      display:inline-flex; align-items:center; justify-content:center;
      border:1px solid ${B.border}; text-decoration:none; transition:all .2s ease;
    }
    .lp-social:hover { background:${B.primary}; color:#fff; transform:translateY(-2px); }

    .lp-team-card {
      background:#fff; border:1px solid ${B.border}; border-radius:14px;
      padding:1.25rem 1rem; text-align:center; transition:all .22s ease;
    }
    .lp-team-card:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(27,79,114,.09); border-color:${B.light}; }
    .lp-avatar {
      width:58px; height:58px; border-radius:50%;
      display:inline-flex; align-items:center; justify-content:center;
      color:#fff; font-weight:700; font-size:1rem; margin-bottom:.6rem;
    }

    .lp-faq .accordion-item   { border:1px solid ${B.border}; border-radius:12px !important; margin-bottom:.55rem; overflow:hidden; }
    .lp-faq .accordion-button { background:#fff; color:${B.text}; font-weight:600; padding:1rem 1.1rem; box-shadow:none !important; font-size:.93rem; }
    .lp-faq .accordion-button:not(.collapsed) { background:${B.soft}; color:${B.dark}; }
    .lp-faq .accordion-body   { color:${B.muted}; line-height:1.6; font-size:.9rem; }

    .lp-cta {
      background:linear-gradient(135deg,${B.primary} 0%,${B.mid} 55%,${B.dark} 100%);
      color:#fff; position:relative; overflow:hidden;
    }
    .lp-cta::before {
      content:""; position:absolute; inset:0; pointer-events:none;
      background:radial-gradient(circle at 20% 40%,rgba(255,255,255,.06) 0%,transparent 45%),
                 radial-gradient(circle at 80% 60%,rgba(255,255,255,.06) 0%,transparent 45%);
    }

    .lp-btn {
      background:${B.primary}; color:#fff; border:none;
      border-radius:999px; font-weight:600; font-size:.9rem;
      display:inline-flex; align-items:center; gap:.45rem; text-decoration:none;
      transition:all .2s ease; box-shadow:0 2px 8px ${B.glow};
    }
    .lp-btn:hover { background:${B.dark}; color:#fff; transform:translateY(-1px); }
    .lp-btn-white {
      background:#fff; color:${B.dark}; border:none; border-radius:999px; font-weight:700;
      box-shadow:0 4px 14px rgba(0,0,0,.12); transition:all .2s ease;
      text-decoration:none; display:inline-flex; align-items:center; gap:.45rem;
    }
    .lp-btn-white:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(0,0,0,.16); color:${B.dark}; }
    .lp-btn-ghost {
      background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.65);
      border-radius:999px; font-weight:600; transition:all .2s ease;
      text-decoration:none; display:inline-flex; align-items:center; gap:.45rem;
    }
    .lp-btn-ghost:hover { background:rgba(255,255,255,.14); border-color:#fff; color:#fff; }

    @media(max-width:767.98px){
      .lp-tag  { display:none !important; }
      .lp-sub  { max-width:100%; }
      .lp-img  { max-height:240px; }
    }
  `}</style>
);

/* ── Hero
   Bootstrap utility classes drive ALL spacing:
   - pt-5 + mt-4  → clears fixed-top navbar (~80px) without hardcoding
   - px-3 px-lg-5 → horizontal padding
   - mb-2         → gap between headline rows
   - mt-4 mx-3 mx-lg-5 → image margin
   ── */
const Hero = () => (
  <section id="home" className="lp-hero pt-5 mt-4">

    {/* Headline block — centered */}
    <div className="px-3 px-lg-5 text-center">

      {/* Row 1: tag label + "Shaping your vision" */}
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 mb-2">
        <div className="lp-tag d-none d-md-block">
          Best construction<br/>company in <strong>India</strong>
        </div>
        <h1 className="lp-h1"><span className="hl">Shaping</span> your vision</h1>
      </div>

      {/* Row 2: "With precision" + description */}
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 mb-4">
        <h1 className="lp-h1">With <span className="hl">precision</span></h1>
        <p className="lp-sub mb-0 text-start">
          Delivering construction solutions grounded in commitment,
          communication, collaboration.
        </p>
      </div>
    </div>

    {/* Hero image — full bleed with side margins */}
    <div className="lp-img-wrap mx-3 mx-lg-5">
      <img src="src/assets/hero.png" alt="Construction site" className="lp-img" />
    </div>

  </section>
);

/* ── Services ── */
const Services = () => (
  <section id="services" className="lp-alt py-5">
    <Container className="py-4">
      <motion.div className="text-center mb-5" initial="hidden" whileInView="visible" viewport={{once:true}} variants={stagger}>
        <motion.div variants={fadeUp}><span className="lp-chip">Our Modules</span></motion.div>
        <motion.h2 variants={fadeUp} className="lp-h2 mt-3">Built for Every Role on Site</motion.h2>
        <motion.p variants={fadeUp} className="lp-lead mt-2 mx-auto" style={{maxWidth:580}}>
          Nine purpose-built modules — one platform, every role.
        </motion.p>
      </motion.div>
      <Row className="g-3">
        {MODULES.map((m,i) => {
          const Icon = m.icon;
          return (
            <Col xs={12} md={6} lg={4} key={m.name}>
              <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.35,delay:i*0.04}}>
                <div className="lp-card">
                  <div className="lp-icon" style={{background:`${m.accent}16`,color:m.accent}}><Icon /></div>
                  <div className="lp-label" style={{color:m.accent,marginBottom:3}}>{m.actor}</div>
                  <h6 style={{fontWeight:700,marginBottom:".35rem"}}>{m.name}</h6>
                  <p style={{color:B.muted,fontSize:".86rem",marginBottom:0}}>{m.desc}</p>
                  <ul className="lp-flist">{m.features.map(f=><li key={f}>{f}</li>)}</ul>
                </div>
              </motion.div>
            </Col>
          );
        })}
      </Row>
    </Container>
  </section>
);

/* ── Workflow ── */
const Workflow = ({ step, setStep }) => {
  const cur = WORKFLOW[step];
  const CurIcon = cur.icon;
  return (
    <section id="workflow" className="py-5">
      <Container className="py-4">
        <div className="text-center mb-5">
          <span className="lp-chip">How It Works</span>
          <h2 className="lp-h2 mt-3">A Cycle That Keeps Building</h2>
          <p className="lp-lead mt-2 mx-auto" style={{maxWidth:560}}>
            Plan, execute, and monitor — every step feeds the next.
          </p>
        </div>
        <Row className="g-4 align-items-center">
          <Col xs={12} lg={5}>
            <div className="d-flex flex-column gap-3">
              {WORKFLOW.map((s,i) => (
                <div key={s.title} className={`lp-step ${i===step?"on":""}`}
                     onClick={()=>setStep(i)} role="button" tabIndex={0}
                     onKeyDown={e=>(e.key==="Enter"||e.key===" ")&&setStep(i)}>
                  <div className="lp-step-num">STEP {String(i+1).padStart(2,"0")}</div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </Col>
          <Col xs={12} lg={7}>
            <div className="lp-viz">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{opacity:0,x:18}} animate={{opacity:1,x:0}}
                            exit={{opacity:0,x:-18}} transition={{duration:0.28}}
                            className="text-center w-100">
                  <div className="lp-icon mx-auto" style={{width:72,height:72,background:B.soft,color:B.primary,fontSize:"1.8rem"}}>
                    <CurIcon />
                  </div>
                  <h4 style={{fontWeight:700,marginTop:".9rem"}}>{cur.title}</h4>
                  <p className="lp-lead mt-2 mx-auto" style={{maxWidth:380}}>{cur.desc}</p>
                  <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                    {["Projects","Resources","Site Logs","Safety","Vendors","Finance","Reports","Alerts"].map(p=>(
                      <span key={p} className="lp-pill">{p}</span>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

/* ── Contact ── */
const ContactSection = () => {
  const [form,setForm]            = useState({firstName:"",lastName:"",email:"",subject:SUBJECTS[0],message:""});
  const [errors,setErrors]        = useState({});
  const [status,setStatus]        = useState({type:null,msg:""});
  const [submitting,setSubmitting] = useState(false);

  const validate = () => {
    const e={}, nameRe=/^[A-Za-z ]{2,40}$/, emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!nameRe.test(form.firstName.trim()))  e.firstName="2–40 letters only.";
    if(!nameRe.test(form.lastName.trim()))   e.lastName ="2–40 letters only.";
    if(!emailRe.test(form.email.trim()))     e.email    ="Valid email required.";
    if(!SUBJECTS.includes(form.subject))     e.subject  ="Choose a subject.";
    if(form.message.trim().length<20||form.message.trim().length>1000) e.message="20–1000 characters.";
    return e;
  };
  const onSubmit = async ev => {
    ev.preventDefault();
    const e=validate(); setErrors(e);
    if(Object.keys(e).length) return;
    setSubmitting(true); setStatus({type:null,msg:""});
    await new Promise(r=>setTimeout(r,800));
    setSubmitting(false);
    setStatus({type:"success",msg:"Thanks — we'll get back within 1 business day."});
    setForm({firstName:"",lastName:"",email:"",subject:SUBJECTS[0],message:""});
  };
  const onChange = k => e => setForm(f=>({...f,[k]:e.target.value}));

  return (
    <section id="contact" className="lp-alt py-5">
      <Container className="py-4">
        <div className="text-center mb-5">
          <span className="lp-chip">Contact</span>
          <h2 className="lp-h2 mt-3">Let's build something together.</h2>
          <p className="lp-lead mt-2 mx-auto" style={{maxWidth:520}}>Questions about modules, pricing, or a demo? Drop us a line.</p>
        </div>
        <Row className="g-4">
          <Col xs={12} lg={5}>
            <div className="lp-contact-info">
              {[
                {icon:FaEnvelope,    label:"hello@buildsmart.app", sub:"Email"},
                {icon:FaPhone,       label:"+91 80 4123 4567",     sub:"Mon–Fri, 9:00–18:00 IST"},
                {icon:FaMapMarkerAlt,label:"BuildSmart HQ",        sub:"Bangalore, India"},
              ].map(({icon:Icon,label,sub}) => (
                <div key={label} className="lp-contact-row">
                  <div className="lp-icon"><Icon /></div>
                  <div>
                    <div style={{fontWeight:600,fontSize:".9rem"}}>{label}</div>
                    <div style={{color:B.muted,fontSize:".8rem"}}>{sub}</div>
                  </div>
                </div>
              ))}
              <div className="d-flex gap-2 mt-4">
                <a href="#" className="lp-social" aria-label="Twitter"><FaTwitter size={13}/></a>
                <a href="#" className="lp-social" aria-label="LinkedIn"><FaLinkedin size={13}/></a>
                <a href="#" className="lp-social" aria-label="GitHub"><FaGithub size={13}/></a>
              </div>
              <div className="mt-4 pt-3" style={{borderTop:`1px dashed ${B.light}`}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:".4rem",background:"rgba(27,79,114,.08)",color:B.dark,padding:".3rem .75rem",borderRadius:"999px",fontSize:".78rem",fontWeight:600}}>
                  <FaCheckCircle /> Built to handle 5,000 concurrent users
                </span>
              </div>
            </div>
          </Col>
          <Col xs={12} lg={7}>
            <Form className="lp-form-wrap" onSubmit={onSubmit} noValidate>
              {status.type==="success" && <Alert variant="success" className="rounded-3">{status.msg}</Alert>}
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">First name</Form.Label>
                  <Form.Control value={form.firstName} onChange={onChange("firstName")} isInvalid={!!errors.firstName} placeholder="Jane"/>
                  <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Label className="small fw-semibold">Last name</Form.Label>
                  <Form.Control value={form.lastName} onChange={onChange("lastName")} isInvalid={!!errors.lastName} placeholder="Builder"/>
                  <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                </Col>
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Email</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={onChange("email")} isInvalid={!!errors.email} placeholder="jane@company.com"/>
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Col>
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Subject</Form.Label>
                  <Form.Select value={form.subject} onChange={onChange("subject")} isInvalid={!!errors.subject}>
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
                </Col>
                <Col xs={12}>
                  <Form.Label className="small fw-semibold">Message</Form.Label>
                  <Form.Control as="textarea" rows={4} value={form.message} onChange={onChange("message")}
                                isInvalid={!!errors.message} placeholder="Tell us about your project, team size, and what you're trying to solve."/>
                  <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
                </Col>
              </Row>
              <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
                <small className="text-muted">We typically respond within 1 business day.</small>
                <button type="submit" className="lp-btn px-4 py-2" disabled={submitting}>
                  {submitting?"Sending…":<>Send message <FaArrowRight size={11}/></>}
                </button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

/* ── Team ── */
const Team = () => {
  const cards = useMemo(()=>TEAM.map(n=>({name:n,ini:initials(n),color:nameColor(n)})),[]);
  return (
    <section id="team" className="py-5">
      <Container className="py-4">
        <div className="text-center mb-5">
          <span className="lp-chip">Meet the Team</span>
          <h2 className="lp-h2 mt-3">Built by engineers, for engineers.</h2>
        </div>
        <Row xs={2} sm={2} md={4} className="g-3">
          {cards.map((c,i) => (
            <Col key={c.name}>
              <motion.div initial={{opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.3,delay:i*0.04}}>
                <div className="lp-team-card">
                  <div className="lp-avatar" style={{background:`linear-gradient(135deg,${c.color},${c.color}bb)`}}>{c.ini}</div>
                  <div style={{fontWeight:700,fontSize:".9rem"}}>{c.name}</div>
                  <div style={{color:B.muted,fontSize:".8rem"}}>Contributor</div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

/* ── FAQ ── */
const FAQ = () => (
  <section id="faq" className="lp-alt py-5">
    <Container className="py-4">
      <div className="text-center mb-5">
        <span className="lp-chip"><FaQuestionCircle /> FAQ</span>
        <h2 className="lp-h2 mt-3">Frequently Asked Questions</h2>
      </div>
      <Row className="justify-content-center">
        <Col xs={12} lg={8}>
          <Accordion defaultActiveKey="0" className="lp-faq">
            {FAQS.map((f,i) => (
              <Accordion.Item key={i} eventKey={String(i)}>
                <Accordion.Header>{f.q}</Accordion.Header>
                <Accordion.Body>{f.a}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Col>
      </Row>
    </Container>
  </section>
);

/* ── CTA Band ── */
const CTABand = () => (
  <section className="lp-cta py-5">
    <Container className="py-4 text-center" style={{position:"relative",zIndex:1}}>
      <motion.h2 initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.45}}
                 style={{fontSize:"clamp(1.8rem,4vw,2.8rem)",fontWeight:800,letterSpacing:"-.03em"}}>
        Ready to Build Smarter?
      </motion.h2>
      <motion.p initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.45,delay:0.1}}
                className="mt-3 mx-auto" style={{maxWidth:560,fontSize:"1.05rem",opacity:0.88}}>
        Join thousands of engineers and contractors revolutionising construction with BuildSmart.
      </motion.p>
      <motion.div initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.45,delay:0.2}}
                  className="d-flex flex-wrap gap-3 justify-content-center mt-4">
        <Link to="/signup" className="lp-btn-white px-4 py-2">Get Started Free <FaArrowRight size={11}/></Link>
        <a href="#contact" className="lp-btn-ghost px-4 py-2">Schedule Demo</a>
      </motion.div>
    </Container>
  </section>
);

export default LandingPage;
export { LandingPage };
