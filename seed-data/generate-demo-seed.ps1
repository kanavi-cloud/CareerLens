$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$processed = Join-Path $root "processed"
New-Item -ItemType Directory -Path $processed -Force | Out-Null

$families = @{
  Backend = @{
    required = @("Java", "Spring Boot", "MySQL", "REST API", "Docker", "AWS", "System Design", "Distributed Systems")
    preferred = @("Kubernetes", "Kafka", "Redis", "CI/CD", "Observability", "Terraform", "GraphQL", "Security")
    roles = @("Backend Software Engineer", "Platform Backend Engineer", "Cloud Backend Engineer", "Software Development Engineer")
    projects = @("high traffic API", "event processing pipeline", "cloud service backend", "distributed data service")
  }
  Frontend = @{
    required = @("TypeScript", "React", "Next.js", "CSS", "REST API", "Design System", "Testing", "Accessibility")
    preferred = @("GraphQL", "Storybook", "Tailwind", "Performance", "Figma", "Playwright", "i18n", "State Management")
    roles = @("Frontend Software Engineer", "Product Frontend Engineer", "Web Application Engineer", "UI Platform Engineer")
    projects = @("dashboard UI", "customer workflow", "design system", "internationalized web app")
  }
}

$jobs = @(
  @{ ref="JOB-US-ATLAS-BE-001"; company="Atlas Cloud"; country="United States"; city="Seattle WA"; family="Backend"; dept="Cloud Platform"; title="Backend Software Engineer"; min=3; work="Hybrid"; salary="USD 135k-185k"; visa="Visa sponsorship considered"; theme="cloud platform APIs"; lang="English:BUSINESS" },
  @{ ref="JOB-US-PACIFIC-BE-001"; company="Pacific Ads"; country="United States"; city="Austin TX"; family="Backend"; dept="Ads Infrastructure"; title="Software Development Engineer"; min=3; work="Onsite"; salary="USD 140k-195k"; visa="Not specified"; theme="ad event ingestion"; lang="English:BUSINESS" },
  @{ ref="JOB-US-REDWOOD-BE-001"; company="Redwood FinTech"; country="United States"; city="New York NY"; family="Backend"; dept="Payments Core"; title="Platform Backend Engineer"; min=4; work="Hybrid"; salary="USD 150k-210k"; visa="Visa sponsorship limited"; theme="payment service reliability"; lang="English:FLUENT" },
  @{ ref="JOB-US-NORTHSTAR-BE-001"; company="Northstar Security"; country="United States"; city="Boston MA"; family="Backend"; dept="Security Engineering"; title="Cloud Backend Engineer"; min=2; work="Remote"; salary="USD 120k-170k"; visa="Not specified"; theme="security automation backend"; lang="English:BUSINESS" },
  @{ ref="JOB-US-SUMMIT-BE-001"; company="Summit Health AI"; country="United States"; city="San Francisco CA"; family="Backend"; dept="Health Data Platform"; title="Backend Software Engineer"; min=4; work="Hybrid"; salary="USD 155k-220k"; visa="Visa sponsorship considered"; theme="health data API"; lang="English:FLUENT" },
  @{ ref="JOB-US-BLUEHARBOR-BE-001"; company="BlueHarbor Games"; country="United States"; city="Los Angeles CA"; family="Backend"; dept="Live Services"; title="Online Services Engineer"; min=3; work="Hybrid"; salary="USD 125k-175k"; visa="Not specified"; theme="game live service backend"; lang="English:BUSINESS" },
  @{ ref="JOB-US-BRIGHT-FE-001"; company="BrightMarket"; country="United States"; city="Chicago IL"; family="Frontend"; dept="Seller Experience"; title="Frontend Software Engineer"; min=2; work="Hybrid"; salary="USD 115k-165k"; visa="Visa sponsorship considered"; theme="seller analytics dashboard"; lang="English:BUSINESS" },
  @{ ref="JOB-US-NOVA-FE-001"; company="Nova Commerce"; country="United States"; city="San Jose CA"; family="Frontend"; dept="Checkout Platform"; title="Product Frontend Engineer"; min=3; work="Onsite"; salary="USD 130k-190k"; visa="Not specified"; theme="checkout web experience"; lang="English:BUSINESS" },
  @{ ref="JOB-US-SKYLINE-FE-001"; company="Skyline Travel"; country="United States"; city="Denver CO"; family="Frontend"; dept="Travel Web"; title="Web Application Engineer"; min=2; work="Remote"; salary="USD 105k-155k"; visa="Visa sponsorship limited"; theme="travel booking interface"; lang="English:BUSINESS" },
  @{ ref="JOB-US-ORBIT-FE-001"; company="Orbit Media"; country="United States"; city="New York NY"; family="Frontend"; dept="Creator Tools"; title="UI Platform Engineer"; min=4; work="Hybrid"; salary="USD 145k-205k"; visa="Not specified"; theme="creator workflow UI"; lang="English:FLUENT" },
  @{ ref="JOB-US-MEADOW-FE-001"; company="Meadow HR"; country="United States"; city="Portland OR"; family="Frontend"; dept="People Product"; title="Frontend Software Engineer"; min=2; work="Remote"; salary="USD 100k-145k"; visa="Not specified"; theme="HR workflow dashboard"; lang="English:BUSINESS" },
  @{ ref="JOB-US-VECTOR-FE-001"; company="Vector Design Systems"; country="United States"; city="Raleigh NC"; family="Frontend"; dept="Design Platform"; title="Design System Engineer"; min=3; work="Hybrid"; salary="USD 120k-175k"; visa="Visa sponsorship considered"; theme="component library platform"; lang="English:BUSINESS" },
  @{ ref="JOB-JP-SAKURA-BE-001"; company="Sakura Cloud"; country="Japan"; city="Tokyo"; family="Backend"; dept="Cloud Infrastructure"; title="Backend Software Engineer"; min=3; work="Hybrid"; salary="JPY 7M-10M"; visa="Visa support available"; theme="cloud control plane API"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-TOKYO-MOB-BE-001"; company="Tokyo Mobility"; country="Japan"; city="Tokyo"; family="Backend"; dept="Mobility Platform"; title="Platform Backend Engineer"; min=4; work="Onsite"; salary="JPY 8M-12M"; visa="Visa support available"; theme="mobility dispatch backend"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-KYOTO-ROB-BE-001"; company="Kyoto Robotics"; country="Japan"; city="Kyoto"; family="Backend"; dept="Robot Cloud"; title="Cloud Backend Engineer"; min=3; work="Hybrid"; salary="JPY 7M-11M"; visa="Not specified"; theme="robot telemetry service"; lang="Japanese:CONVERSATIONAL|English:BUSINESS" },
  @{ ref="JOB-JP-NIPPON-FIN-BE-001"; company="Nippon Fintech"; country="Japan"; city="Tokyo"; family="Backend"; dept="Settlement Core"; title="Backend Software Engineer"; min=5; work="Hybrid"; salary="JPY 9M-13M"; visa="Visa support available"; theme="settlement transaction API"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-OSAKA-RETAIL-BE-001"; company="Osaka Retail Tech"; country="Japan"; city="Osaka"; family="Backend"; dept="Commerce Backend"; title="Software Development Engineer"; min=2; work="Remote"; salary="JPY 6M-9M"; visa="Not specified"; theme="retail inventory backend"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-KANTO-DATA-BE-001"; company="Kanto Data Systems"; country="Japan"; city="Yokohama"; family="Backend"; dept="Data Platform"; title="Data Backend Engineer"; min=4; work="Hybrid"; salary="JPY 8M-12M"; visa="Visa support limited"; theme="data ingestion backend"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-RAKUDA-FE-001"; company="Rakuda Commerce"; country="Japan"; city="Tokyo"; family="Frontend"; dept="Commerce Web"; title="Frontend Software Engineer"; min=2; work="Hybrid"; salary="JPY 6M-9M"; visa="Visa support available"; theme="commerce storefront"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-SHIBUYA-FE-001"; company="Shibuya Media Lab"; country="Japan"; city="Tokyo"; family="Frontend"; dept="Media Product"; title="Product Frontend Engineer"; min=3; work="Onsite"; salary="JPY 7M-10M"; visa="Not specified"; theme="media editing UI"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-FUJI-FE-001"; company="Fuji Travel Tech"; country="Japan"; city="Nagoya"; family="Frontend"; dept="Travel Experience"; title="Web Application Engineer"; min=2; work="Remote"; salary="JPY 6M-9M"; visa="Visa support limited"; theme="travel itinerary interface"; lang="Japanese:CONVERSATIONAL|English:BUSINESS" },
  @{ ref="JOB-JP-KANSAI-FE-001"; company="Kansai SaaS Works"; country="Japan"; city="Osaka"; family="Frontend"; dept="Admin Console"; title="UI Platform Engineer"; min=4; work="Hybrid"; salary="JPY 8M-11M"; visa="Visa support available"; theme="B2B admin console"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-MIRAI-FE-001"; company="Mirai EdTech"; country="Japan"; city="Fukuoka"; family="Frontend"; dept="Learning Product"; title="Frontend Software Engineer"; min=2; work="Hybrid"; salary="JPY 5.5M-8.5M"; visa="Not specified"; theme="learning dashboard"; lang="Japanese:BUSINESS" },
  @{ ref="JOB-JP-GINZA-FE-001"; company="Ginza Design Cloud"; country="Japan"; city="Tokyo"; family="Frontend"; dept="Design Collaboration"; title="Design System Engineer"; min=3; work="Hybrid"; salary="JPY 7M-10M"; visa="Visa support available"; theme="collaboration design system"; lang="Japanese:BUSINESS" }
)

function Pick-Join($items, $start, $count) {
  $result = @()
  for ($i = 0; $i -lt $count; $i++) {
    $result += $items[($start + $i) % $items.Count]
  }
  return ($result -join "|")
}

function Slug($value) {
  return ($value -replace "[^A-Za-z0-9]", "").ToUpper()
}

$jobRows = New-Object System.Collections.Generic.List[object]
$employeeRows = New-Object System.Collections.Generic.List[object]
$acceptedRows = New-Object System.Collections.Generic.List[object]
$patternRows = New-Object System.Collections.Generic.List[object]
$deadlinePool = @(
  "2026-05-20",
  "2026-05-28",
  "2026-06-03",
  "2026-06-10",
  "2026-06-15",
  "2026-06-20",
  "2026-06-24",
  "2026-06-30",
  "2026-07-08",
  "2026-07-15",
  "2026-07-22",
  "2026-07-31"
)

$jobIndex = 0
foreach ($job in $jobs) {
  $jobIndex++
  $family = $families[$job.family]
  $required = Pick-Join $family.required ($jobIndex % 5) 5
  $preferred = Pick-Join $family.preferred ($jobIndex % 6) 4
  $portfolioRequired = if ($job.family -eq "Frontend") { "true" } else { if ($jobIndex % 2 -eq 0) { "true" } else { "false" } }
  $githubRequired = "true"
  $salaryScore = 60 + (($jobIndex * 7) % 35)
  $wlbScore = if ($job.work -eq "Remote") { 88 } elseif ($job.work -eq "Hybrid") { 78 } else { 62 }
  $companyScore = 68 + (($jobIndex * 5) % 27)
  $deadline = $deadlinePool[($jobIndex - 1) % $deadlinePool.Count]

  $jobRows.Add([pscustomobject]@{
    external_ref=$job.ref; source_type="dummy_seed"; source_name="careerlens_generated"; source_url="";
    company_name=$job.company; country=$job.country; city=$job.city; department=$job.dept; job_title=$job.title; job_family=$job.family;
    employment_type="Full-time"; work_type=$job.work; required_skills=$required; preferred_skills=$preferred; required_languages=$job.lang;
    min_experience_years=$job.min; max_experience_years=""; degree_requirement="Bachelor or equivalent"; major_requirement="Computer Science or related";
    certification_requirement="Not specified"; portfolio_required=$portfolioRequired; github_required=$githubRequired; visa_requirement=$job.visa; salary_range=$job.salary;
    application_deadline=$deadline; job_summary="Dummy job posting for $($job.theme) in $($job.country)."; core_responsibilities="Design $($job.theme)|Build reliable services|Collaborate with product and data teams|Improve production quality";
    raw_notes="Generated dummy posting for CareerLens capstone prototype. Not real external data.";
    salary_score=$salaryScore; work_life_balance_score=$wlbScore; company_value_score=$companyScore;
    probability_weight=30; salary_weight=15; work_life_balance_weight=15; company_value_weight=15; job_fit_weight=25;
    evaluation_rationale="Generated evaluation weights for prototype recommendation scoring. Job fit and acceptance probability remain primary.";
    active="true"
  }) | Out-Null

  $sampleRefs = @()
  for ($emp = 1; $emp -le 5; $emp++) {
    $sampleRef = "EMP-" + (Slug $job.ref) + "-$('{0:D2}' -f $emp)"
    $sampleRefs += $sampleRef
    $exp = [int]$job.min + $emp + ($jobIndex % 2)
    $related = [Math]::Max([int]$job.min, $exp - 1)
    $skillStart = ($jobIndex + $emp) % $family.required.Count
    $prefStart = ($jobIndex + $emp) % $family.preferred.Count
    $techStack = (Pick-Join $family.required $skillStart 4) + "|" + (Pick-Join $family.preferred $prefStart 2)
    $cert = if ($job.country -eq "Japan") { if ($emp % 2 -eq 0) { "JLPT N1" } else { "JLPT N2" } } else { if ($emp % 2 -eq 0) { "AWS Certified Developer" } else { "Not specified" } }
    $languages = if ($job.country -eq "Japan") { "Japanese|English" } else { "English" }
    $employeeRows.Add([pscustomobject]@{
      sample_ref=$sampleRef; source_type="dummy_seed"; source_name="careerlens_generated"; source_url="";
      anonymized_label="$($job.company) $($job.family) employee sample $emp";
      current_company=$job.company; current_job_title=$family.roles[($emp + $jobIndex) % $family.roles.Count]; matched_job_family=$job.family;
      current_country=$job.country; current_city=$job.city; education="Bachelor"; major="Computer Science"; graduation_status="Graduated";
      total_experience_years=$exp; related_experience_years=$related;
      career_history="Junior Engineer $($exp - 2) years|$($job.company) $($job.family) Engineer 2 years";
      tech_stack=$techStack; domain_experience=$job.theme; certifications=$cert; languages=$languages;
      github_present= if ($emp -eq 5) { "false" } else { "true" };
      portfolio_present= if ($job.family -eq "Frontend" -or $emp % 2 -eq 0) { "true" } else { "false" };
      project_experience_notes="Dummy anonymized sample with experience in $($job.theme), $($family.projects[($emp + $jobIndex) % $family.projects.Count]), and production collaboration.";
      raw_notes="Generated dummy employee sample. No real person or external profile.";
      public_safe="true"
    }) | Out-Null
  }

  for ($candidate = 1; $candidate -le 20; $candidate++) {
    $candidateRef = "ACP-" + (Slug $job.ref) + "-$('{0:D2}' -f $candidate)"
    $employeeMix = $sampleRefs[($candidate - 1) % 5] + "|" + $sampleRefs[$candidate % 5]
    $expYears = [int]$job.min + (($candidate + $jobIndex) % 5)
    $skillStart = ($candidate + $jobIndex) % $family.required.Count
    $prefStart = ($candidate + $jobIndex) % $family.preferred.Count
    $assets = if ($candidate % 4 -eq 0) { "GitHub" } else { "GitHub|Portfolio" }
    $candidateCore = Pick-Join $family.required $skillStart 5
    $candidatePref = Pick-Join $family.preferred $prefStart 4
    $acceptedRows.Add([pscustomobject]@{
      accepted_pattern_ref=$candidateRef; job_external_ref=$job.ref; employee_sample_refs=$employeeMix;
      pattern_title="$($job.company) $($job.family) accepted candidate model $candidate";
      job_family=$job.family; modeled_experience_years=$expYears; modeled_languages=$job.lang;
      modeled_education="Bachelor or equivalent"; modeled_certifications= if ($job.country -eq "Japan") { "JLPT N1|Cloud Fundamentals" } else { "AWS Cloud Practitioner|Cloud Fundamentals" };
      modeled_core_skills=$candidateCore; modeled_preferred_skills=$candidatePref; modeled_portfolio_assets=$assets;
      modeled_project_keywords="$($job.theme)|$($family.projects[($candidate + $jobIndex) % $family.projects.Count])|production quality";
      derivation_reason="Generated from dummy job requirements and anonymized employee sample mix for CareerLens prototype.";
      source_confidence= if ($candidate % 3 -eq 0) { "MEDIUM" } else { "HIGH" };
      review_status="APPROVED"
    }) | Out-Null
  }

  $patternKinds = @(
    @{ suffix="CORE"; title="core job-fit pattern"; expAdd=0; asset="GitHub|Portfolio" },
    @{ suffix="PORTFOLIO"; title="portfolio evidence pattern"; expAdd=1; asset="GitHub|Portfolio" },
    @{ suffix="BRIDGE"; title="bridge candidate pattern"; expAdd=-1; asset="GitHub" }
  )
  $patternNo = 0
  foreach ($kind in $patternKinds) {
    $patternNo++
    $patternRows.Add([pscustomobject]@{
      pattern_ref="PAT-" + (Slug $job.ref) + "-$($kind.suffix)";
      accepted_pattern_ref="ACP-" + (Slug $job.ref) + "-$('{0:D2}' -f $patternNo)";
      job_external_ref=$job.ref; employee_sample_ref=$sampleRefs[$patternNo - 1];
      pattern_title="$($job.company) $($job.family) $($kind.title)";
      job_family=$job.family; core_skills=Pick-Join $family.required ($jobIndex + $patternNo) 5;
      preferred_skills=Pick-Join $family.preferred ($jobIndex + $patternNo) 4;
      target_experience_years=[Math]::Max(1, [int]$job.min + $kind.expAdd);
      language_benchmark= if ($job.country -eq "Japan") { "BUSINESS" } else { "BUSINESS" };
      education_benchmark="Bachelor or equivalent";
      certifications= if ($job.country -eq "Japan") { "JLPT N1|Cloud Fundamentals" } else { "AWS Cloud Practitioner|Cloud Fundamentals" };
      github_expected="true"; portfolio_expected= if ($kind.asset -like "*Portfolio*") { "true" } else { "false" };
      project_experience_benchmark="$($job.theme)|$($family.projects[($jobIndex + $patternNo) % $family.projects.Count])|measurable output";
      evidence_summary="Final PatternProfile synthesized from 20 dummy accepted-candidate models and 5 anonymized employee samples for $($job.company) $($job.title).";
      active="true"
    }) | Out-Null
  }
}

$jobRows | Export-Csv -Path (Join-Path $processed "job-postings.csv") -NoTypeInformation -Encoding UTF8
$employeeRows | Export-Csv -Path (Join-Path $processed "employee-samples.csv") -NoTypeInformation -Encoding UTF8
$acceptedRows | Export-Csv -Path (Join-Path $processed "accepted-candidate-patterns.csv") -NoTypeInformation -Encoding UTF8
$patternRows | Export-Csv -Path (Join-Path $processed "pattern-profiles.csv") -NoTypeInformation -Encoding UTF8

[pscustomobject]@{
  job_postings = $jobRows.Count
  employee_samples = $employeeRows.Count
  accepted_candidate_patterns = $acceptedRows.Count
  pattern_profiles = $patternRows.Count
} | ConvertTo-Json
