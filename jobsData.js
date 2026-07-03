const mockJobs = [
  // 1. Healthcare, Life Sciences & Public Sector
  {
    id: "hlp-1",
    company: "Pfizer",
    title: "Senior Bioinformatics Research Scientist (Remote)",
    category: "Healthcare, Life Sciences & Public Sector",
    location: "Remote (USA)",
    salary: "$135,000 - $170,000",
    description: "Pfizer is seeking a Senior Bioinformatics Research Scientist to join our remote clinical genomics team. You will analyze large-scale multi-omics datasets, design statistical pipelines, and collaborate with therapeutic units to identify novel biomarkers for vaccine development. Requirements: PhD or MS in Bioinformatics, Computational Biology, or Computer Science. 3+ years experience with Python/R, Docker, Nextflow, and cloud environments (AWS/GCP). Familiarity with clinical trial genomics standards is highly preferred.",
    skills: ["Bioinformatics", "Computational Biology", "Python", "Docker", "Nextflow", "AWS", "Genomics", "R"],
    customQuestions: [
      "Explain your experience processing next-generation sequencing (NGS) data in cloud environments.",
      "How do you handle data pipeline failures in Nextflow workflows?"
    ]
  },
  {
    id: "hlp-2",
    company: "Mayo Clinic",
    title: "Healthcare Information Security Analyst (Remote)",
    category: "Healthcare, Life Sciences & Public Sector",
    location: "Remote (USA)",
    salary: "$110,000 - $145,000",
    description: "The Mayo Clinic is looking for a Healthcare Information Security Analyst. You will be responsible for conducting risk assessments of clinical systems, ensuring HIPAA compliance across virtual networks, and implementing access control frameworks. Requirements: Bachelor's degree in IT/Cybersecurity, CISSP or HCISPP certification, and 4+ years of healthcare cybersecurity experience. Knowledge of NIST SP 800-53 and EHR system integrations (Epic/Cerner) is required.",
    skills: ["Cybersecurity", "HIPAA Compliance", "NIST", "Risk Assessment", "EHR Systems", "CISSP", "Epic"],
    customQuestions: [
      "Describe a scenario where you had to balance patient data accessibility with strict HIPAA controls.",
      "What is your approach to conducting a risk assessment on a third-party healthcare application?"
    ]
  },

  // 2. Big Tech, Cloud & Enterprise Platforms
  {
    id: "btc-1",
    company: "Google Cloud",
    title: "Staff Cloud Solutions Architect (Remote)",
    category: "Big Tech, Cloud & Enterprise Platforms",
    location: "Remote (USA)",
    salary: "$180,000 - $250,000",
    description: "Google Cloud is hiring a Staff Cloud Solutions Architect. You will design, build, and deliver scalable enterprise systems on GCP for fortune 500 companies. This role focuses on kubernetes migrations, serverless design patterns, and multicloud strategies. Requirements: BS/MS in CS or equivalent experience. 8+ years architecting enterprise architectures. Deep expertise with Google Kubernetes Engine (GKE), Anthos, BigQuery, Terraform, and modern microservices orchestration. Google Cloud Professional Architect Certification is highly desired.",
    skills: ["Cloud Architecture", "GCP", "Kubernetes", "GKE", "Terraform", "Microservices", "BigQuery", "Anthos"],
    customQuestions: [
      "Discuss a large-scale Kubernetes migration you designed and how you mitigated downtime.",
      "How do you approach multi-region data replication and latency constraints in GCP?"
    ]
  },
  {
    id: "btc-2",
    company: "Salesforce",
    title: "Senior Enterprise React Developer (Remote)",
    category: "Big Tech, Cloud & Enterprise Platforms",
    location: "Remote (Global)",
    salary: "$140,000 - $190,000",
    description: "Salesforce is seeking a Senior Frontend React Developer to build the next-generation of our enterprise dashboards. You will build highly responsive interfaces, establish design system standards, and optimize rendering performance for data-heavy views. Requirements: 5+ years of production experience with React, TypeScript, Redux, and CSS modules. Expertise in frontend performance optimization (lazy-loading, bundle splitting, rendering cycles) and automated testing (Jest, Cypress).",
    skills: ["React", "TypeScript", "Redux", "CSS", "Frontend Optimization", "Jest", "Cypress"],
    customQuestions: [
      "What is your strategy for optimizing rendering performance in React tables displaying thousands of live records?",
      "How do you structure reusable component APIs in a large enterprise design system?"
    ]
  },

  // 3. Consulting & Professional Services
  {
    id: "cps-1",
    company: "Accenture",
    title: "Digital Transformation Manager (Remote)",
    category: "Consulting & Professional Services",
    location: "Remote (USA)",
    salary: "$120,000 - $160,000",
    description: "Accenture is recruiting a Digital Transformation Manager. You will lead client-facing teams to map business processes, design digital transformation strategies, and manage enterprise technology integrations (CRM/ERP). Requirements: MBA or equivalent business degree. 5+ years consulting experience (preferably Big 4). Strong understanding of agile delivery, change management frameworks, and executive stakeholder communication. Experience with SaaS integrations (Salesforce, SAP, or Workday) is required.",
    skills: ["Digital Transformation", "Consulting", "Agile", "Change Management", "SaaS Integration", "Salesforce", "ERP"],
    customQuestions: [
      "How do you handle resistance to change from key client stakeholders during a digital transformation rollout?",
      "Provide an example of a metric you used to measure the success of an enterprise CRM integration."
    ]
  },
  {
    id: "cps-2",
    company: "Deloitte",
    title: "Cloud Migration consultant (Remote)",
    category: "Consulting & Professional Services",
    location: "Remote (USA)",
    salary: "$95,000 - $130,000",
    description: "Deloitte Consulting is hiring a Cloud Migration Consultant. You will assist corporate clients in moving workloads from legacy on-premise infrastructure to public clouds (AWS/Azure). You will conduct cloud readiness assessments, formulate migration plans (rehost/replatform/refactor), and build secure foundation environments. Requirements: 3+ years IT consulting or infrastructure experience. Solid understanding of cloud migration patterns, Terraform, and cloud networking (VPC, DNS, VPN). Certification in AWS or Azure is preferred.",
    skills: ["Cloud Migration", "AWS", "Azure", "Terraform", "Infrastructure", "Cloud Networking", "Consulting"],
    customQuestions: [
      "What factors do you consider when deciding whether to 'rehost' versus 'replatform' a legacy application?",
      "Explain your experience setting up cross-cloud networking between Azure and AWS."
    ]
  },

  // 4. Financial Services & Insurance
  {
    id: "fsi-1",
    company: "Stripe",
    title: "Senior Backend Payments Engineer (Remote)",
    category: "Financial Services & Insurance",
    location: "Remote (Global)",
    salary: "$160,000 - $220,000",
    description: "Stripe is seeking a Senior Backend Engineer to join our core payments infrastructure team. You will build highly reliable, transactional APIs handling millions of requests daily, improve ledger consistency models, and integrate international banking rails. Requirements: 6+ years experience writing production code in Ruby, Go, or Java. Solid foundation in distributed systems, ACID transactions, database partitioning, and idempotency patterns. Prior experience in fintech or billing systems is a huge plus.",
    skills: ["Backend Engineering", "Distributed Systems", "Ruby", "Go", "Java", "ACID Transactions", "Fintech", "APIs"],
    customQuestions: [
      "Explain how you design an API endpoint to support strict idempotency and avoid double-charging.",
      "How would you troubleshoot a distributed transaction breakdown that caused ledgers to fall out of sync?"
    ]
  },
  {
    id: "fsi-2",
    company: "JPMorgan Chase",
    title: "Quantitative Risk Developer - Python (Remote)",
    category: "Financial Services & Insurance",
    location: "Remote (USA)",
    salary: "$130,000 - $180,000",
    description: "JPMorgan Chase is looking for a Remote Quantitative Risk Developer. You will develop and optimize mathematical models for credit and market risk assessment. This role involves maintaining high-performance computation packages, compiling quantitative financial models, and generating real-time risk calculations. Requirements: Master's in Quantitative Finance, Mathematics, or Computer Science. 3+ years experience with high-performance Python (NumPy, SciPy, Pandas, Numba). Knowledge of derivatives pricing models and Monte Carlo simulations.",
    skills: ["Python", "Quantitative Finance", "NumPy", "Pandas", "Risk Modeling", "Monte Carlo", "SciPy"],
    customQuestions: [
      "How do you optimize a slow Python NumPy array operation that is bottlenecking a Monte Carlo simulation?",
      "Describe your understanding of Value at Risk (VaR) models and how you implement them in code."
    ]
  },

  // 5. Manufacturing, Retail & Consumer
  {
    id: "mrc-1",
    company: "Nike",
    title: "Global Supply Chain Data Analyst (Remote)",
    category: "Manufacturing, Retail & Consumer",
    location: "Remote (USA)",
    salary: "$90,000 - $125,000",
    description: "Nike is seeking a Global Supply Chain Data Analyst. You will build supply chain intelligence models to forecast inventory requirements, analyze shipping bottle-necks, and optimize global logistics routes. Requirements: 3+ years analyzing supply chain or operations data. Master level SQL, experience with Tableau/PowerBI, and analytical Python (Pandas/Statsmodels). Strong understanding of demand forecasting models (ARIMA, Prophet) and inventory optimization principles.",
    skills: ["Data Analysis", "SQL", "Tableau", "Python", "Supply Chain", "Demand Forecasting", "Logistics"],
    customQuestions: [
      "How do you evaluate and handle outlier data (like sudden shipping delays) in your demand forecasting models?",
      "Provide an example of an insight you discovered in supply chain data that led to cost savings."
    ]
  },
  {
    id: "mrc-2",
    company: "Tesla",
    title: "Remote Diagnostics & IoT Systems Engineer (Remote)",
    category: "Manufacturing, Retail & Consumer",
    location: "Remote (USA)",
    salary: "$120,000 - $160,000",
    description: "Tesla is looking for a Systems Engineer to join our vehicle diagnostics and telematics software team remotely. You will design software that monitors vehicle fleet telemetry, detects hardware faults in real-time, and dispatches remote firmware diagnostic commands. Requirements: Degree in EE, CS, or Systems Engineering. 4+ years working with embedded systems or IoT networks. Proficiency in C++ or Rust, telemetry streaming (MQTT, Kafka), and network diagnostics protocols.",
    skills: ["Systems Engineering", "IoT", "Embedded C++", "Rust", "Kafka", "Telemetry", "Diagnostics"],
    customQuestions: [
      "How do you manage high-frequency telemetry data streams over high-latency cellular networks?",
      "Describe a time you diagnosed a complex hardware/software interface issue using remote logging."
    ]
  },

  // 6. Technology, Data Centers & Infrastructure
  {
    id: "tdi-1",
    company: "Equinix",
    title: "Infrastructure Automation Architect (Remote)",
    category: "Technology, Data Centers & Infrastructure",
    location: "Remote (Global)",
    salary: "$150,000 - $200,000",
    description: "Equinix is hiring an Infrastructure Automation Architect. You will lead the design and implementation of automated APIs and CLI tooling to manage bare metal physical server instances across global data centers. You will develop automated provisioning workflows and software-defined network (SDN) configurations. Requirements: 6+ years in systems engineering or infrastructure automation. Deep experience with Ansible, Terraform, Python, Linux kernel networking, and PXE booting / hardware provisioning systems.",
    skills: ["Infrastructure Automation", "Ansible", "Terraform", "Python", "Linux Networking", "Bare Metal", "SDN"],
    customQuestions: [
      "Describe how you would design a secure, zero-touch provisioning workflow for bare-metal servers.",
      "Explain the differences in managing state between Ansible and Terraform in a physical infrastructure environment."
    ]
  },
  {
    id: "tdi-2",
    company: "Cloudflare",
    title: "Systems Security Engineer - Edge Network (Remote)",
    category: "Technology, Data Centers & Infrastructure",
    location: "Remote (Global)",
    salary: "$145,000 - $195,000",
    description: "Cloudflare is looking for a Systems Security Engineer to join our edge networking team. You will build and audit security controls protecting edge proxy servers handling substantial internet traffic. Requirements: 4+ years in low-level security engineering. Expert-level Go or Rust, solid understanding of TLS protocol details, DNS security (DNSSEC), Linux eBPF, and mitigation of DDoS attacks at layers 3, 4, and 7.",
    skills: ["Security Engineering", "Go", "Rust", "TLS", "DNSSEC", "eBPF", "DDoS Mitigation", "Networking"],
    customQuestions: [
      "Explain the cryptographic handshakes in TLS 1.3 and how it improves latency and security over TLS 1.2.",
      "How does eBPF help in filtering high-volume DDoS attacks at the edge?"
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockJobs };
} else {
  window.mockJobs = mockJobs;
}
