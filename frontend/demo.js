/* Fixture data for ?demo=1 — shaped exactly like a /search response, so the
   layout can be worked on without calling Semantic Scholar or OpenAI. */

window.DEMO = {
  query: 'machine learning in healthcare',
  results: [
    {
      Title: 'Deep Learning for Electronic Health Records: A Comparative Review of Multiple Deep Neural Architectures',
      URL: 'https://www.semanticscholar.org/paper/demo1',
      Abstract: 'Despite the recent progress in deep learning applied to structured clinical data, there is no consensus on which architecture generalises best across heterogeneous electronic health record systems. We benchmark convolutional, recurrent and transformer-based encoders on four de-identified inpatient cohorts totalling 1.2 million admissions, holding preprocessing and label definitions fixed. Transformer encoders outperform recurrent baselines on long-horizon mortality prediction but show no advantage on tasks with fewer than roughly 200 observations per patient, where simple gradient-boosted trees remain competitive. We release the harness and argue that reported gains in this literature are frequently attributable to cohort construction rather than to architecture.',
      Year: 2020,
      CitationCount: 1284,
      RelevanceScore: 0.742,
    },
    {
      Title: 'Machine Learning in Medicine: Addressing Ethical Challenges',
      URL: 'https://www.semanticscholar.org/paper/demo2',
      Abstract: 'Clinical machine learning systems are increasingly deployed without a settled account of how responsibility is distributed between developer, institution and clinician. We examine three recurring failure modes — distributional shift after deployment, the encoding of historical inequities in training labels, and the erosion of informed consent when models mediate triage — and propose governance requirements for each.',
      Year: 2018,
      CitationCount: 892,
      RelevanceScore: 0.631,
    },
    {
      Title: 'Federated Learning for Multi-Institutional Clinical Prediction Without Data Sharing',
      URL: 'https://www.semanticscholar.org/paper/demo3',
      Abstract: 'We evaluate federated averaging across nineteen hospital sites for sepsis onset prediction, comparing against both centrally pooled training and single-site models. Federated models recover 94% of the pooled model AUROC while no patient-level record leaves its originating institution. Performance degrades sharply when site cohorts differ in coding practice, which we partially mitigate with local batch-normalisation statistics.',
      Year: 2023,
      CitationCount: 214,
      RelevanceScore: 0.588,
    },
    {
      Title: 'Interpretable Risk Stratification in Emergency Triage: A Prospective Cohort Study',
      URL: 'https://www.semanticscholar.org/paper/demo4',
      Abstract: 'Black-box risk scores are rarely adopted at the bedside. In a prospective study of 34,000 emergency presentations we compare a sparse additive model against a gradient-boosted ensemble, measuring both discrimination and the rate at which attending physicians override the score. The sparse model loses 0.02 AUROC and is overridden less than half as often.',
      Year: 2022,
      CitationCount: 376,
      RelevanceScore: 0.541,
    },
    {
      Title: 'A Survey of Convolutional Neural Networks for Medical Image Segmentation',
      URL: 'https://www.semanticscholar.org/paper/demo5',
      Abstract: 'This survey catalogues 240 published architectures for volumetric medical image segmentation between 2015 and 2021, organised by encoder family, skip-connection topology and loss formulation. We note that fewer than a fifth report results on any external validation set.',
      Year: 2021,
      CitationCount: 2140,
      RelevanceScore: 0.497,
    },
    {
      Title: 'Reporting Standards for Prediction Models in Clinical Research: The TRIPOD Extension',
      URL: 'https://www.semanticscholar.org/paper/demo6',
      Abstract: null,
      Year: 2024,
      CitationCount: 58,
      RelevanceScore: 0.333,
    },
  ],
  llm_summary: `1. **Summary**: Benchmarks convolutional, recurrent and transformer encoders on four inpatient EHR cohorts covering 1.2 million admissions, with preprocessing and label definitions held constant across architectures. Transformers lead on long-horizon mortality prediction, but gradient-boosted trees remain competitive where patients have fewer than about 200 observations.

**Relevance**: This is a direct methodological survey of machine learning applied to routine clinical data, which is the centre of your query rather than an adjacent application.

**Recommendation**: Highly Relevant — the fixed-harness comparison makes it unusually good evidence on whether architecture choice matters at all.

2. **Summary**: Examines three recurring ethical failure modes in deployed clinical models: distributional shift after deployment, historical inequity encoded in training labels, and the erosion of informed consent when models mediate triage. Proposes governance requirements for each.

**Relevance**: Addresses the deployment and governance side of your query rather than modelling technique; useful if your interest extends past predictive performance.

**Recommendation**: Moderately Relevant — strong on framing, but contains no empirical results.

3. **Summary**: Evaluates federated averaging across nineteen hospital sites for sepsis onset prediction, comparing against centrally pooled and single-site training. Federated models recover 94% of pooled AUROC with no patient record leaving its originating institution, though performance degrades where sites differ in coding practice.

**Relevance**: Speaks to the practical constraint that most healthcare machine learning work runs into — that the data cannot be centralised.

**Recommendation**: Highly Relevant — particularly if multi-site data access is a constraint in your own work.

4. **Summary**: A prospective study of 34,000 emergency presentations comparing a sparse additive model against a gradient-boosted ensemble, measured on both discrimination and physician override rate. The sparse model loses 0.02 AUROC but is overridden less than half as often.

**Relevance**: Connects model interpretability to actual clinical uptake, which is the step most of this literature omits.

**Recommendation**: Moderately Relevant — narrow to emergency triage, but the override-rate measure is transferable.

5. **Summary**: Catalogues 240 published architectures for volumetric medical image segmentation from 2015 to 2021, organised by encoder family, skip-connection topology and loss formulation. Notes that fewer than a fifth report results on any external validation set.

**Relevance**: Imaging is a distinct subfield from the clinical-data focus your query implies, though the external-validation finding generalises.

**Recommendation**: Tangentially Relevant — read for the validation critique rather than the catalogue.

6. **Summary**: No abstract was deposited for this record, so the content cannot be characterised beyond the title, which indicates a reporting-standards extension for clinical prediction models.

**Relevance**: Likely a methodological checklist rather than a research finding; relevance to your query cannot be assessed from the metadata available.

**Recommendation**: Tangentially Relevant — retrieve the full text before deciding.`,
};
