#!/usr/bin/env python3
"""Generates assets/data/*.json for Vertex Unity.

Edit the tables below (or add rows to data/extra_universities.csv, see import_csv.py)
and run:  python3 scripts/generate_data.py

IMPORTANT: figures are APPROXIMATE, rounded, written from general knowledge and
must be verified on official sites before you publish them as facts. The app
labels them "approximate" everywhere. Use the in-app Data Health page to correct
entries; corrections are stored in Supabase and override this file.
"""
import json, os, re

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "data")
os.makedirs(OUT, exist_ok=True)

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def num(x):
    x = x.strip()
    if x in ("", "-"):
        return None
    try:
        v = float(x)
        return int(v) if v == int(v) else v
    except ValueError:
        return None

# ---------------------------------------------------------------- universities
# id|name|short|city|country|type|tuition|living|years|ielts|toefl|sat|accept%|deadline|aid|strong majors|url|description
FULL = """
mit|Massachusetts Institute of Technology|MIT|Cambridge, MA|United States|Technical research university|62000|24000|4|7.0|100|1520-1580|4.5|Jan 1|Need-blind for international students; meets full demonstrated need|cs,ee,me,math,phys,aero,ds|https://mitadmissions.org|World-leading research university for engineering, computing and science.
harvard|Harvard University|Harvard|Cambridge, MA|United States|Private research university|59000|24000|4|7.0|100|1500-1580|3.5|Jan 1|Need-blind for international students; meets full demonstrated need|econ,law,pir,med,psy,bus,math|https://college.harvard.edu/admissions|Oldest US university, strongest across social sciences, law and medicine.
stanford|Stanford University|Stanford|Stanford, CA|United States|Private research university|62000|25000|4|7.0|100|1500-1570|3.6|Jan 5|Need-based aid for international students|cs,ee,econ,bus,ds,med|https://admission.stanford.edu|Silicon Valley research university known for computing, engineering and entrepreneurship.
caltech|California Institute of Technology|Caltech|Pasadena, CA|United States|Technical research university|63000|26000|4|7.5|100|1530-1580|2.7|Jan 3|Need-blind for international students; meets full need|phys,math,cs,ee,aero,chem|https://www.admissions.caltech.edu|Very small, research-intensive science and engineering institute.
princeton|Princeton University|Princeton|Princeton, NJ|United States|Private research university|62000|23000|4|7.0|100|1510-1580|4.6|Jan 1|Need-blind for international students; meets full need|math,phys,econ,pir,cs|https://admission.princeton.edu|Undergraduate-focused Ivy with strong maths, physics and public policy.
yale|Yale University|Yale|New Haven, CT|United States|Private research university|66000|23000|4|7.0|100|1500-1580|4.5|Jan 2|Need-blind for international students; meets full need|law,pir,econ,psy,med|https://admissions.yale.edu|Ivy known for humanities, law, and a residential college system.
uchicago|University of Chicago|UChicago|Chicago, IL|United States|Private research university|68000|23000|4|7.0|104|1510-1570|4.5|Jan 6|Need-based aid; no-loan policy for many families|econ,math,pir,law,phys|https://collegeadmissions.uchicago.edu|Famous for economics, rigorous core curriculum and research culture.
penn|University of Pennsylvania|Penn|Philadelphia, PA|United States|Private research university|64000|22000|4|7.0|100|1500-1570|5.9|Jan 5|Need-based aid for international students|bus,fin,econ,med,psy|https://admissions.upenn.edu|Ivy with the Wharton School and strong pre-professional programs.
columbia|Columbia University|Columbia|New York, NY|United States|Private research university|71000|29000|4|7.0|100|1510-1570|3.9|Jan 1|Need-based aid for international students|econ,pir,law,cs,fin,psy|https://undergrad.admissions.columbia.edu|Ivy in New York City with a famous common core.
cornell|Cornell University|Cornell|Ithaca, NY|United States|Private research university|69000|22000|4|7.0|100|1500-1560|7.5|Jan 2|Need-based aid for international students|cs,ee,me,bus,econ,arch|https://admissions.cornell.edu|Large Ivy with strong engineering, hotel, agriculture and computing.
duke|Duke University|Duke|Durham, NC|United States|Private research university|66000|22000|4|7.0|100|1520-1570|5.1|Jan 2|Need-based aid; merit scholarships for some applicants|med,econ,pir,cs|https://admissions.duke.edu|Strong across pre-med, public policy and engineering.
northwestern|Northwestern University|Northwestern|Evanston, IL|United States|Private research university|68000|22000|4|7.0|100|1500-1560|7|Jan 3|Need-based aid for international students|econ,cs,psy,pir|https://admissions.northwestern.edu|Chicago-area research university with flexible, interdisciplinary study.
brown|Brown University|Brown|Providence, RI|United States|Private research university|71000|22000|4|7.0|100|1500-1570|5.2|Jan 5|Need-based aid for international students|cs,econ,pir,psy,math|https://admission.brown.edu|Ivy known for its open curriculum.
dartmouth|Dartmouth College|Dartmouth|Hanover, NH|United States|Private research university|68000|21000|4|7.0|100|1500-1570|5.4|Jan 3|Need-blind for international students|econ,cs,pir|https://admissions.dartmouth.edu|Small Ivy with intense undergraduate teaching.
jhu|Johns Hopkins University|JHU|Baltimore, MD|United States|Private research university|66000|21000|4|7.0|100|1520-1570|6.5|Jan 3|Need-based aid for international students|med,bio,pir,cs,ds|https://apply.jhu.edu|Research pioneer in medicine, public health and biomedical engineering.
cmu|Carnegie Mellon University|CMU|Pittsburgh, PA|United States|Private research university|63000|34000|4|7.0|100|1520-1580|11|Jan 3|Need-based aid; limited for international students|cs,ds,ee,me,math|https://admission.cmu.edu|World-class computer science, robotics and AI.
amherst|Amherst College|Amherst|Amherst, MA|United States|Liberal arts college|69000|18000|4|7.0|100|1480-1560|7|Jan 3|Need-blind for international students; meets full need|econ,math,psy,phys|https://www.amherst.edu/admission|Top liberal arts college with an open curriculum.
williams|Williams College|Williams|Williamstown, MA|United States|Liberal arts college|68000|18000|4|7.0|100|1490-1560|8|Jan 9|Need-blind for international students; meets full need|econ,math,psy|https://admission.williams.edu|Small liberal arts college with tutorial-style teaching.
berea|Berea College|Berea|Berea, KY|United States|Liberal arts college|0|7000|4|6.5|71|Not used|30|Nov 30|Tuition-free for admitted students through the work-study program|bus,cs,psy|https://www.berea.edu/admissions|Tuition-free college where every student works on campus.
asu|Arizona State University|ASU|Tempe, AZ|United States|Public research university|34000|17000|4|6.5|61|Not used|90|Mar 1|Merit scholarships for international students|cs,ee,me,bus,psy|https://admission.asu.edu|Very large public university with broad programs and easy admission.
ucsd|University of California, San Diego|UC San Diego|La Jolla, CA|United States|Public research university|48000|20000|4|7.0|80|Not used|30|Nov 30|Very limited aid for international students|cs,bio,econ,ds|https://admissions.ucsd.edu|Top public research university strong in biology and computing.
ucb|University of California, Berkeley|UC Berkeley|Berkeley, CA|United States|Public research university|49000|22000|4|7.0|80|Not used|11|Nov 30|Very limited aid for international students|cs,ee,econ,math,bus|https://admissions.berkeley.edu|Public research powerhouse in computing, engineering and economics.
uw|University of Washington|UW Seattle|Seattle, WA|United States|Public research university|41000|19000|4|6.5|76|Not used|43|Jan 15|Limited aid for international students|cs,bio,med,ds|https://admit.washington.edu|Large public university with strong computing and health sciences.
uiuc|University of Illinois Urbana-Champaign|UIUC|Champaign, IL|United States|Public research university|36000|16000|4|6.5|79|Not used|45|Jan 5|Merit scholarships for some international students|cs,ee,me,aero,ds|https://admissions.illinois.edu|Top engineering and computer science public university.
utaustin|University of Texas at Austin|UT Austin|Austin, TX|United States|Public research university|42000|18000|4|6.5|80|Not used|29|Dec 1|Limited aid for international students|cs,bus,econ,ee,psy|https://admissions.utexas.edu|Large flagship public research university.
gatech|Georgia Institute of Technology|Georgia Tech|Atlanta, GA|United States|Public technical university|34000|17000|4|7.0|90|1370-1520|16|Jan 4|Merit scholarships for some international students|cs,ee,me,aero,ds|https://admission.gatech.edu|Top public engineering and computing university.
nyu|New York University|NYU|New York, NY|United States|Private research university|62000|28000|4|7.0|100|1500-1560|8|Jan 5|Need-based aid for international students|bus,fin,econ,law,psy|https://www.nyu.edu/admissions|Global university in Manhattan.
umich|University of Michigan|Michigan|Ann Arbor, MI|United States|Public research university|64000|18000|4|6.5|88|1490-1560|18|Feb 1|Merit scholarships for some international students|cs,ee,me,bus,econ,psy|https://admissions.umich.edu|Large public research university with excellent engineering and business.
nyuad|New York University Abu Dhabi|NYU Abu Dhabi|Abu Dhabi|United Arab Emirates|Private research university|62000|0|4|7.0|100|1450-1560|5|Jan 1|Need-blind; meets full need for admitted students|cs,econ,pir,math|https://nyuad.nyu.edu/en/admissions.html|NYU's liberal-arts campus in the UAE with very generous aid.
utoronto|University of Toronto|U of T|Toronto|Canada|Public research university|45000|15000|4|6.5|100|Not used|43|Jan 15|Pearson Scholarship for outstanding international students|cs,econ,med,bus,psy|https://future.utoronto.ca|Canada's top-ranked research university.
ubc|University of British Columbia|UBC|Vancouver|Canada|Public research university|42000|16000|4|6.5|90|Not used|52|Jan 15|International Scholars Program and entrance awards|cs,bus,econ,psy,me|https://you.ubc.ca|Leading public research university on the Pacific coast.
mcgill|McGill University|McGill|Montreal|Canada|Public research university|32000|16000|4|6.5|90|Not used|46|Jan 15|Merit entrance awards for international students|med,law,econ,psy|https://www.mcgill.ca/applying|Historic English-language university in Montreal.
waterloo|University of Waterloo|Waterloo|Waterloo|Canada|Public research university|38000|14000|4|6.5|90|Not used|53|Feb 1|Merit awards for international students|cs,ee,me,math,ds|https://uwaterloo.ca/future-students|Famous for computer science, engineering and co-op placements.
oxford|University of Oxford|Oxford|Oxford|United Kingdom|Collegiate research university|48000|20000|3|7.0|110|Not used|17|Oct 15|Clarendon and college scholarships (mostly postgraduate)|econ,law,pir,math,cs,med|https://www.ox.ac.uk/admissions|Oldest English-speaking university; tutorial teaching.
cambridge|University of Cambridge|Cambridge|Cambridge|United Kingdom|Collegiate research university|50000|20000|3|7.5|110|Not used|18|Oct 15|Cambridge Trust scholarships (mostly postgraduate)|math,cs,econ,phys,law,med|https://www.undergraduate.study.cam.ac.uk|Historic research university strong in maths and sciences.
imperial|Imperial College London|Imperial|London|United Kingdom|Technical research university|50000|20000|3|6.5|92|Not used|14|Jan 14|Some scholarships; mostly merit-based|ee,me,cs,aero,math,med|https://www.imperial.ac.uk/study|Science, engineering, medicine and business in central London.
ucl|University College London|UCL|London|United Kingdom|Public research university|40000|22000|3|6.5|92|Not used|63|Jan 29|Global Undergraduate Scholarship (limited)|arch,law,psy,econ,cs|https://www.ucl.ac.uk/prospective-students|Large multidisciplinary university in London.
lse|London School of Economics|LSE|London|United Kingdom|Social science university|38000|22000|3|7.0|100|Not used|9|Jan 29|LSE undergraduate support for lower-income students|econ,pir,law,fin,bus|https://www.lse.ac.uk/study-at-lse|World leader in economics and social sciences.
edinburgh|University of Edinburgh|Edinburgh|Edinburgh|United Kingdom|Public research university|36000|16000|4|6.5|92|Not used|40|Jan 29|Global Scholarships for international students|cs,law,psy,med|https://www.ed.ac.uk/studying|Scotland's historic university with 4-year degrees.
manchester|University of Manchester|Manchester|Manchester|United Kingdom|Public research university|33000|14000|3|6.5|90|Not used|56|Jan 29|Global Futures scholarships|me,ee,bus,cs|https://www.manchester.ac.uk/study|Large research university in a student city.
kcl|King's College London|King's College London|London|United Kingdom|Public research university|36000|21000|3|6.5|92|Not used|13|Jan 29|Limited scholarships|law,pir,psy,med|https://www.kcl.ac.uk/study|Strong in law, humanities and health sciences.
tum|Technical University of Munich|TUM|Munich|Germany|Technical university|6000|13000|3|6.5|88|Not used|30|Jul 15|DAAD and TUM scholarships; check fees for non-EU students|ee,me,cs,aero,math,phys|https://www.tum.de/en/studies|Germany's top technical university.
lmu|Ludwig Maximilian University of Munich|LMU Munich|Munich|Germany|Public research university|0|13000|3|6.5|88|Not used|40|Jul 15|DAAD scholarships; no tuition for most programmes|econ,law,psy,phys|https://www.lmu.de/en/study|Leading German research university with no tuition fees.
heidelberg|Heidelberg University|Heidelberg|Heidelberg|Germany|Public research university|6000|12000|3|6.5|88|Not used|40|Jul 15|DAAD scholarships; non-EU fee about 3,000 EUR per semester|med,bio,phys|https://www.uni-heidelberg.de/en/study|Germany's oldest university.
rwth|RWTH Aachen University|RWTH Aachen|Aachen|Germany|Technical university|3000|11000|3|6.5|88|Not used|40|Jul 15|DAAD scholarships; non-EU fee about 1,500 EUR per semester|me,ee,aero,cs|https://www.rwth-aachen.de/cms/root/en/studium|Major German engineering university.
tuberlin|Technische Universität Berlin|TU Berlin|Berlin|Germany|Technical university|0|12000|3|6.5|88|Not used|40|Jul 15|DAAD scholarships; no tuition fee|ee,me,cs,arch|https://www.tu.berlin/en/studying|Large technical university in Berlin with no tuition.
delft|Delft University of Technology|TU Delft|Delft|Netherlands|Technical university|17000|14000|3|6.5|90|Not used|50|Jan 15|Holland Scholarship and TU Delft Excellence Scholarship|me,ee,aero,arch,cs|https://www.tudelft.nl/en/education|Top Dutch engineering and architecture university.
uva|University of Amsterdam|UvA|Amsterdam|Netherlands|Public research university|14500|14000|3|6.5|92|Not used|60|Apr 1|Amsterdam Merit Scholarship|econ,psy,law,pir,cs|https://www.uva.nl/en/education|Large research university in the capital.
utrecht|Utrecht University|Utrecht|Utrecht|Netherlands|Public research university|14500|13000|3|6.5|92|Not used|60|May 1|Holland Scholarship|bio,law,econ,psy|https://www.uu.nl/en/education|Leading Dutch research university.
tue|Eindhoven University of Technology|TU/e|Eindhoven|Netherlands|Technical university|14000|12000|3|6.5|90|Not used|60|Apr 1|TU/e Scholarship|ee,me,cs,ds|https://www.tue.nl/en/education|Technology university at the heart of Brainport.
leiden|Leiden University|Leiden|Leiden|Netherlands|Public research university|14500|13000|3|6.5|92|Not used|60|May 1|Holland Scholarship and Leiden Excellence|law,pir,psy|https://www.universiteitleiden.nl/en/education|Netherlands' oldest university.
aalto|Aalto University|Aalto|Espoo|Finland|Technical and arts university|12000|11000|3|6.5|92|Not used|20|Jan 15|Aalto scholarships cover tuition for strong applicants|ee,me,cs,arch,bus|https://www.aalto.fi/en/study-at-aalto|Finnish university combining technology, business and art and design.
helsinki|University of Helsinki|Helsinki|Helsinki|Finland|Public research university|13000|11000|3|6.5|92|Not used|20|Jan 15|University scholarships for non-EU degree students|bio,math,phys,law|https://www.helsinki.fi/en/admissions-and-education|Finland's oldest and largest university.
aalborg|Aalborg University|Aalborg|Aalborg|Denmark|Public research university|12000|12000|3|6.5|83|Not used|50|Mar 15|Limited tuition waivers|cs,ee,me,arch|https://www.aau.dk/education|University famous for problem-based learning and engineering.
aarhus|Aarhus University|Aarhus|Aarhus|Denmark|Public research university|13000|13000|3|6.5|83|Not used|50|Mar 15|Limited scholarships|econ,bus,bio|https://www.au.dk/en/education|Research university strong in business, agriculture and natural sciences.
copenhagen|University of Copenhagen|Copenhagen|Copenhagen|Denmark|Public research university|15000|14000|3|6.5|83|Not used|45|Mar 15|Limited scholarships|econ,law,bio,med|https://studies.ku.dk|Denmark's oldest and largest university.
kth|KTH Royal Institute of Technology|KTH|Stockholm|Sweden|Technical university|15000|12000|3|6.5|90|Not used|40|Jan 15|KTH Global Scholarship (partial)|ee,me,cs,aero|https://www.kth.se/en/studies|Sweden's largest technical university.
lund|Lund University|Lund|Lund|Sweden|Public research university|14000|12000|3|6.5|90|Not used|40|Jan 15|Lund University Global Scholarship (partial)|econ,law,pir,bus|https://www.lunduniversity.lu.se/admissions|Historic Swedish university with a strong international community.
eth|ETH Zurich|ETH Zurich|Zurich|Switzerland|Technical university|1500|22000|3|7.0|100|Not used|30|Dec 15|Excellence scholarships (mostly master's)|cs,ee,me,math,phys|https://ethz.ch/en/studies|Europe's leading technical university; undergraduate teaching in German.
epfl|EPFL|EPFL|Lausanne|Switzerland|Technical university|1500|18000|3|7.0|100|Not used|40|Apr 30|Excellence fellowships (mostly master's)|cs,ee,me,math,phys|https://www.epfl.ch/education|Leading technical university; bachelor taught in French.
bme|Budapest University of Technology and Economics|BME|Budapest|Hungary|Technical university|6000|7000|3.5|6.0|80|Not used|50|Jan 15|Stipendium Hungaricum full scholarship|ee,me,cs,arch|https://www.bme.hu/admission|Hungary's leading engineering university.
corvinus|Corvinus University of Budapest|Corvinus|Budapest|Hungary|Public university|6000|7500|3|6.5|85|Not used|60|Jan 15|Stipendium Hungaricum full scholarship|econ,bus,fin,pir|https://www.uni-corvinus.hu/admission|Hungarian leader in economics, business and public policy.
semmelweis|Semmelweis University|Semmelweis|Budapest|Hungary|Medical university|16000|8000|6|6.0|80|Not used|30|Jan 15|Stipendium Hungaricum full scholarship|med|https://semmelweis.hu/english/education|Hungary's leading medical university with an English programme.
elte|Eötvös Loránd University|ELTE|Budapest|Hungary|Public research university|5000|7000|3|6.0|80|Not used|50|Jan 15|Stipendium Hungaricum full scholarship|math,phys,cs,psy|https://www.elte.hu/en|Hungary's oldest university; strong sciences.
amu|Adam Mickiewicz University|Adam Mickiewicz|Poznań|Poland|Public research university|3500|6000|3|5.5|60|Not used|60|Jun 30|Polish government scholarships|psy,pir,bio|https://welcome.amu.edu.pl|Large public university in Poznań.
uw-warsaw|University of Warsaw|U Warsaw|Warsaw|Poland|Public research university|3500|6500|3|5.5|60|Not used|60|Jun 30|NAWA and Polish government scholarships|econ,law,math|https://www.uw.edu.pl/admission|Poland's top-ranked university.
jagiellonian|Jagiellonian University|Jagiellonian|Kraków|Poland|Public research university|3500|6000|3|5.5|60|Not used|60|Jun 30|Polish government scholarships|med,psy,bio|https://en.uj.edu.pl/en|Poland's oldest university, founded 1364.
unibo|University of Bologna|Bologna|Bologna|Italy|Public research university|3500|11000|3|5.5|70|Not used|70|Jan 31|Regional DSU scholarships|econ,law,pir,eng|https://www.unibo.it/en/teaching|The world's oldest university in continuous operation.
polimi|Politecnico di Milano|Polimi|Milan|Italy|Technical university|4000|12000|3|5.5|78|Not used|60|Jan 15|Politecnico merit scholarships|arch,me,ee,cs|https://www.polimi.it/en|Italy's largest technical university, famous for design and architecture.
polito|Politecnico di Torino|Polito|Turin|Italy|Technical university|3000|9500|3|5.5|78|Not used|60|Jan 15|Regional scholarships and tuition reduction|me,ee,cs,arch|https://www.polito.it/en|Italian technical university; Turin has a partner campus in Tashkent.
sorbonne|Sorbonne University|Sorbonne|Paris|France|Public research university|3000|12000|3|6.0|80|Not used|50|Jan 15|Eiffel scholarships (master's and doctorate)|math,phys,med,law|https://www.sorbonne-universite.fr/en|Large Paris university covering sciences, medicine and humanities.
polytechnique|École Polytechnique|Polytechnique|Palaiseau|France|Grande école|15000|14000|3|6.5|90|Not used|25|Jan 10|Polytechnique Foundation scholarships|math,phys,cs,ee|https://www.polytechnique.edu/en|Elite French engineering school.
sciencespo|Sciences Po|Sciences Po|Paris|France|Grande école|14000|13000|3|7.0|100|Not used|19|Jan 5|Emile Boutmy scholarships|pir,law,econ|https://www.sciencespo.fr/en|Leading European university for political science.
snu|Seoul National University|SNU|Seoul|South Korea|Public research university|6000|9000|4|6.0|88|Not used|20|Sep 18|GKS full scholarship|econ,cs,ee,me,med|https://en.snu.ac.kr/admission|South Korea's most selective university.
kaist|KAIST|KAIST|Daejeon|South Korea|Technical university|5000|8000|4|6.0|83|Not used|20|Sep 20|Generous merit scholarships for international students|cs,ee,me,math,phys|https://admission.kaist.ac.kr/intl-undergraduate|Science and technology university with strong scholarships.
yonsei|Yonsei University|Yonsei|Seoul|South Korea|Private research university|9000|9000|4|6.0|83|Not used|30|Sep 20|Yonsei scholarships and GKS|bus,econ,pir,cs|https://admission.yonsei.ac.kr/intl|One of Korea's top private universities.
postech|POSTECH|POSTECH|Pohang|South Korea|Technical university|6000|8000|4|6.0|80|Not used|25|Sep 20|Full-tuition scholarships for international students|phys,math,cs,ee|https://www.postech.ac.kr/eng|Small research-focused science and technology university.
utokyo|University of Tokyo|U Tokyo|Tokyo|Japan|Public research university|5000|10000|4|6.5|90|Not used|30|Jan 10|MEXT scholarship and UTokyo fellowships|math,phys,econ,cs|https://www.u-tokyo.ac.jp/en/prospective-students|Japan's top university; English-taught PEAK programme.
kyoto|Kyoto University|Kyoto|Kyoto|Japan|Public research university|5000|9000|4|6.5|90|Not used|30|Jan 10|MEXT scholarship; Kyoto iUP programme|math,phys,bio|https://www.kyoto-u.ac.jp/en/education-campus|Japan's second imperial university.
waseda|Waseda University|Waseda|Tokyo|Japan|Private research university|11000|10000|4|6.5|90|Not used|40|Jan 20|Waseda scholarships; MEXT|pir,econ,bus,law|https://www.waseda.jp/inst/admission/en|Leading private university with many English-taught programmes.
sophia|Sophia University|Sophia|Tokyo|Japan|Private research university|9000|10000|4|6.0|80|Not used|40|Nov 30|Sophia scholarships (partial)|pir,law,econ,psy|https://www.sophia.ac.jp/eng/admissions|Catholic university with a large English-taught programme.
keio|Keio University|Keio|Tokyo|Japan|Private research university|10000|10000|4|6.5|85|Not used|40|Jan 20|Keio scholarships; MEXT|econ,bus,law|https://www.keio.ac.jp/en/admissions|Japan's oldest private university.
tsinghua|Tsinghua University|Tsinghua|Beijing|China|Public research university|5500|6000|4|6.5|90|Not used|10|Mar 31|Chinese Government Scholarship; Schwarzman (master's)|cs,ee,me,econ,phys|https://iso.tsinghua.edu.cn/en|China's top engineering and technology university.
peking|Peking University|Peking|Beijing|China|Public research university|4500|6000|4|6.5|90|Not used|10|Mar 31|Chinese Government Scholarship; Yenching Academy (master's)|econ,pir,math,law|https://www.isd.pku.edu.cn/English|China's most prestigious comprehensive university.
zju|Zhejiang University|Zhejiang|Hangzhou|China|Public research university|4500|5500|4|6.5|90|Not used|15|Mar 31|Chinese Government Scholarship|cs,ee,me,med|https://iczu.zju.edu.cn/English|Large research university in Hangzhou.
fudan|Fudan University|Fudan|Shanghai|China|Public research university|4500|6500|4|6.5|90|Not used|15|Mar 31|Chinese Government Scholarship|econ,med,pir|https://iso.fudan.edu.cn/en|Top Shanghai university.
sjtu|Shanghai Jiao Tong University|SJTU|Shanghai|China|Public research university|5000|6500|4|6.5|90|Not used|15|Mar 31|Chinese Government Scholarship|me,ee,cs,bus|https://isc.sjtu.edu.cn/EN|Strong engineering and business university in Shanghai.
nus|National University of Singapore|NUS|Singapore|Singapore|Public research university|28000|12000|4|6.5|92|Not used|10|Feb 28|NUS scholarships and Tuition Grant (service bond)|cs,ee,me,econ,bus,ds|https://nus.edu.sg/oam|Asia's top-ranked comprehensive university.
ntu|Nanyang Technological University|NTU|Singapore|Singapore|Public research university|26000|11000|4|6.5|90|Not used|10|Mar 1|NTU scholarships and Tuition Grant (service bond)|cs,ee,me,bus|https://www.ntu.edu.sg/admissions|Technology-focused university in Singapore.
bilkent|Bilkent University|Bilkent|Ankara|Turkey|Private research university|14000|7000|4|6.5|87|Not used|50|Jun 30|Türkiye Scholarships; Bilkent scholarships|cs,ee,econ,bus,law|https://w3.bilkent.edu.tr/bilkent|Turkey's leading private English-medium university.
koc|Koç University|Koç|Istanbul|Turkey|Private research university|25000|8000|4|6.5|87|Not used|30|Jun 15|Generous merit scholarships; Türkiye Scholarships|cs,econ,bus,med|https://admissions.ku.edu.tr|Private research university in Istanbul.
metu|Middle East Technical University|METU|Ankara|Turkey|Public research university|5000|5500|4|6.5|87|Not used|50|Jun 30|Türkiye Scholarships|ee,me,aero,cs|https://iso.metu.edu.tr|Turkey's top English-medium public technical university.
ada|ADA University|ADA|Baku|Azerbaijan|National / regional university||| 4|6.0|75|Not used|-|Apr 8|Alimardan bay Topchubashov fellowship for international students (no separate application)|pir,bus,cs|https://www.ada.edu.az/en/admissions|English-taught university for diplomacy, business and IT.
nu|Nazarbayev University|Nazarbayev|Astana|Kazakhstan|Public research university|12000|5000|4|6.0|80|Not used|10|Mar 15|Grants for Kazakh citizens; merit awards for international students|cs,ee,me,bus,med|https://nu.edu.kz/admissions|English-medium flagship research university in Kazakhstan.
kbtu|Kazakh-British Technical University|KBTU|Almaty|Kazakhstan|Technical university|5000|4000|4|5.5|60|Not used|60|Jun 20|Merit scholarships|cs,ee|https://kbtu.edu.kz|Technical and business university in Almaty.
melb|University of Melbourne|Melbourne|Melbourne|Australia|Public research university|40000|18000|3|6.5|79|Not used|70|Oct 31|Melbourne International Undergraduate Scholarship|law,med,bus,econ|https://study.unimelb.edu.au|Australia's top-ranked research university.
sydney|University of Sydney|Sydney|Sydney|Australia|Public research university|42000|18000|3|6.5|85|Not used|70|Oct 31|Sydney International Scholars|med,law,arch,bus|https://www.sydney.edu.au/study|Historic university with strong breadth.
anu|Australian National University|ANU|Canberra|Australia|Public research university|40000|17000|3|6.5|80|Not used|70|Oct 31|ANU Chancellor's International Scholarship|pir,econ,phys|https://www.anu.edu.au/study|Research-intensive national university in Canberra.
unsw|UNSW Sydney|UNSW|Sydney|Australia|Public research university|41000|17000|3|6.5|90|Not used|70|Oct 31|UNSW International Scholars|cs,ee,me,bus|https://www.unsw.edu.au/study|Strong in engineering and business.
"""

# ------------------------------------------------- catalogue entries without full data yet
# name|city|country|description    (id is generated from the name)
BASIC = """
Abai Kazakh National Pedagogical University|Almaty|Kazakhstan|Kazakhstan's main teacher-training university.
Ablai Khan University|Almaty|Kazakhstan|University of international relations and world languages.
Adam Smith Business School Tashkent|Tashkent|Uzbekistan|Business-focused higher education institution.
Westminster International University in Tashkent|Tashkent|Uzbekistan|English-taught degrees in business, law and IT with University of Westminster partnership.
Inha University in Tashkent|Tashkent|Uzbekistan|Korean-partnered campus focused on IT and logistics.
Turin Polytechnic University in Tashkent|Tashkent|Uzbekistan|Engineering and design degrees in partnership with Politecnico di Torino.
Webster University Tashkent|Tashkent|Uzbekistan|American-style liberal arts and business degrees.
Management Development Institute of Singapore in Tashkent|Tashkent|Uzbekistan|Business and engineering programmes in partnership with MDIS.
AKFA University|Tashkent|Uzbekistan|Private university with engineering and medical programmes.
National University of Uzbekistan|Tashkent|Uzbekistan|Uzbekistan's oldest and largest national university.
Tashkent State University of Economics|Tashkent|Uzbekistan|Leading Uzbek university for economics and finance.
Tashkent University of Information Technologies|Tashkent|Uzbekistan|National university for IT and telecommunications.
Samarkand State University|Samarkand|Uzbekistan|Large regional university.
Satbayev University|Almaty|Kazakhstan|Technical university focused on engineering and mining.
KIMEP University|Almaty|Kazakhstan|English-taught business, economics and social sciences university.
Suleyman Demirel University|Almaty|Kazakhstan|English-medium university with Turkish roots.
American University of Central Asia|Bishkek|Kyrgyzstan|Liberal-arts university in Kyrgyzstan.
Tbilisi State University|Tbilisi|Georgia|Georgia's oldest university.
Ilia State University|Tbilisi|Georgia|Research university with English-taught programmes.
Yerevan State University|Yerevan|Armenia|Armenia's main state university.
Khazar University|Baku|Azerbaijan|English-medium private university in Baku.
Baku Higher Oil School|Baku|Azerbaijan|Energy-focused technical university.
Boston University|Boston, MA|United States|Large private research university with the Trustee Scholarship.
Boston College|Chestnut Hill, MA|United States|Jesuit university with strong undergraduate teaching.
Georgetown University|Washington, DC|United States|Private university known for international affairs.
Emory University|Atlanta, GA|United States|Private research university.
Vanderbilt University|Nashville, TN|United States|Private research university.
Rice University|Houston, TX|United States|Small research university with strong sciences.
University of Notre Dame|Notre Dame, IN|United States|Private Catholic research university.
Washington University in St. Louis|St. Louis, MO|United States|Private research university.
Tufts University|Medford, MA|United States|Private research university near Boston.
Wesleyan University|Middletown, CT|United States|Liberal arts college.
Swarthmore College|Swarthmore, PA|United States|Small selective liberal arts college.
Pomona College|Claremont, CA|United States|Liberal arts college in California.
Bowdoin College|Brunswick, ME|United States|Liberal arts college.
Middlebury College|Middlebury, VT|United States|Liberal arts college known for languages.
Haverford College|Haverford, PA|United States|Small liberal arts college.
Carleton College|Northfield, MN|United States|Liberal arts college.
Colby College|Waterville, ME|United States|Liberal arts college.
Northeastern University|Boston, MA|United States|Research university known for co-op.
Purdue University|West Lafayette, IN|United States|Public engineering powerhouse.
Ohio State University|Columbus, OH|United States|Large public research university.
Texas A&M University|College Station, TX|United States|Large public research university.
Virginia Tech|Blacksburg, VA|United States|Public technical university.
University of Massachusetts Amherst|Amherst, MA|United States|Public research university.
University of Rochester|Rochester, NY|United States|Private research university.
Case Western Reserve University|Cleveland, OH|United States|Private research university.
University of Alberta|Edmonton|Canada|Large public research university.
McMaster University|Hamilton|Canada|Research university known for health sciences.
Queen's University|Kingston|Canada|Public research university.
Western University|London, ON|Canada|Public research university.
University of Calgary|Calgary|Canada|Public research university.
Simon Fraser University|Burnaby|Canada|Public research university near Vancouver.
University of Bristol|Bristol|United Kingdom|Public research university.
University of Warwick|Coventry|United Kingdom|Public research university.
University of Glasgow|Glasgow|United Kingdom|Historic Scottish university.
University of Birmingham|Birmingham|United Kingdom|Public research university.
Durham University|Durham|United Kingdom|Collegiate research university.
University of Nottingham|Nottingham|United Kingdom|Public research university.
University of Southampton|Southampton|United Kingdom|Public research university.
University of St Andrews|St Andrews|United Kingdom|Scotland's oldest university.
University of Sheffield|Sheffield|United Kingdom|Public research university.
University of Leeds|Leeds|United Kingdom|Large public research university.
Aberystwyth University|Aberystwyth|United Kingdom|Welsh university known for international relations.
Freie Universität Berlin|Berlin|Germany|Public research university.
Karlsruhe Institute of Technology|Karlsruhe|Germany|Technical research university.
TU Dresden|Dresden|Germany|Technical research university.
University of Göttingen|Göttingen|Germany|Public research university.
University of Mannheim|Mannheim|Germany|Business and economics university.
Erasmus University Rotterdam|Rotterdam|Netherlands|Business, economics and law university.
University of Groningen|Groningen|Netherlands|Public research university.
Tilburg University|Tilburg|Netherlands|Social science and business university.
University of Vienna|Vienna|Austria|Austria's largest university.
KU Leuven|Leuven|Belgium|Belgium's top university.
Ghent University|Ghent|Belgium|Public research university.
Trinity College Dublin|Dublin|Ireland|Ireland's top-ranked university.
University College Dublin|Dublin|Ireland|Ireland's largest university.
Charles University|Prague|Czechia|Central Europe's oldest university.
Czech Technical University in Prague|Prague|Czechia|Technical university.
University of Tartu|Tartu|Estonia|Estonia's national university.
Vilnius University|Vilnius|Lithuania|Lithuania's oldest university.
Riga Technical University|Riga|Latvia|Technical university.
University of Oslo|Oslo|Norway|Norway's top university.
Norwegian University of Science and Technology|Trondheim|Norway|Technical university.
University of Barcelona|Barcelona|Spain|Large public research university.
IE University|Madrid|Spain|Private business-focused university.
Universidade de Lisboa|Lisbon|Portugal|Portugal's largest university.
University of Porto|Porto|Portugal|Public research university.
American University of Beirut|Beirut|Lebanon|Leading English-medium university in the region.
King Abdullah University of Science and Technology|Thuwal|Saudi Arabia|Graduate research university.
Khalifa University|Abu Dhabi|United Arab Emirates|Science and technology university.
Tokyo Institute of Technology|Tokyo|Japan|Technical university.
Osaka University|Osaka|Japan|Major national university.
Hokkaido University|Sapporo|Japan|National university with many English programmes.
Hanyang University|Seoul|South Korea|Private university strong in engineering.
Korea University|Seoul|South Korea|Top private university.
University of Hong Kong|Hong Kong|Hong Kong|Hong Kong's oldest university.
Hong Kong University of Science and Technology|Hong Kong|Hong Kong|Technology-focused research university.
Chinese University of Hong Kong|Hong Kong|Hong Kong|Research university.
National Taiwan University|Taipei|Taiwan|Taiwan's top university.
Universiti Malaya|Kuala Lumpur|Malaysia|Malaysia's oldest university.
Monash University|Melbourne|Australia|Large Group of Eight university.
University of Queensland|Brisbane|Australia|Group of Eight research university.
University of Auckland|Auckland|New Zealand|New Zealand's largest university.
University of Otago|Dunedin|New Zealand|New Zealand's oldest university.
University of Cape Town|Cape Town|South Africa|Africa's top-ranked university.
"""

MAJORS = [
 ("econ","Economics","Social Sciences","Microeconomics · Macroeconomics · Econometrics","Policy, finance, consulting, research and public institutions"),
 ("bus","Business Administration","Business","Strategic Management · Corporate Finance · Marketing","Management, entrepreneurship, consulting and operations"),
 ("fin","Finance","Business","Investments · Financial Accounting · Derivatives","Banking, asset management, fintech and corporate finance"),
 ("cs","Computer Science","Technology","Algorithms · Data Structures · Operating Systems","Software engineering, AI, research and startups"),
 ("ds","Data Science","Technology","Statistics · Machine Learning · Data Visualization","Analytics, machine learning, research and product roles"),
 ("ee","Electrical Engineering","Engineering","Circuits · Signals & Systems · Electromagnetics","Electronics, telecoms, energy and embedded systems"),
 ("me","Mechanical Engineering","Engineering","Thermodynamics · Fluid Mechanics · Materials","Manufacturing, automotive, energy and robotics"),
 ("math","Mathematics","Sciences","Real Analysis · Linear Algebra · Probability","Research, finance, data science and teaching"),
 ("phys","Physics","Sciences","Classical Mechanics · Quantum Mechanics · Electromagnetism","Research, engineering, data science and technology"),
 ("pir","Political Science & IR","Social Sciences","Comparative Politics · International Relations · Political Theory","Diplomacy, policy, NGOs and international organisations"),
 ("law","Law","Social Sciences","Contract Law · Constitutional Law · International Law","Legal practice, public service and compliance"),
 ("med","Medicine","Health","Anatomy · Physiology · Pharmacology","Clinical practice, research and public health"),
 ("psy","Psychology","Social Sciences","Cognitive Psychology · Research Methods · Developmental Psychology","Clinical work, research, UX and human resources"),
 ("arch","Architecture","Design","Design Studio · Building Technology · Urban Planning","Architecture, urban design and construction"),
 ("aero","Aerospace Engineering","Engineering","Aerodynamics · Flight Mechanics · Propulsion","Aviation, space industry and defence research"),
 ("logi","Logistics & Supply Chain","Business","Operations Research · Transport Economics · Procurement","Global trade, operations and supply chain management"),
 ("bio","Biology & Biotechnology","Sciences","Genetics · Cell Biology · Bioinformatics","Research, biotech, healthcare and environment"),
 ("chem","Chemistry","Sciences","Organic Chemistry · Physical Chemistry · Analytical Methods","Research, pharmaceuticals and materials"),
 ("eng","Engineering (general)","Engineering","Mechanics · Design · Mathematics for Engineers","Broad engineering careers across industries"),
]

# country guides: language, tuition range, living per month, intake, work during, work after, portal, note
GUIDES = {
 "United States": ["English","$25,000–65,000","$1,500–2,500","August/September","Limited (on-campus, up to 20h/week on F-1)","Up to 1 year OPT (3 for STEM)","https://educationusa.state.gov","Apply through Common App; many colleges need financial proof and the CSS Profile."],
 "United Kingdom": ["English","$25,000–50,000","$1,300–2,200","September","Up to 20h/week in term (Student visa)","Graduate route: 2 years","https://www.ucas.com","Undergraduate applications go through UCAS; Oxford and Cambridge close on Oct 15."],
 "Canada": ["English / French","$20,000–45,000","$1,000–1,600","September","Off-campus up to 24h/week","Post-graduation work permit up to 3 years","https://www.educanada.ca","Study permit and proof of funds required; provincial attestation letters now apply."],
 "Germany": ["German / English","$0–15,000 (varies by state)","$900–1,200","October (winter) / April","120 full days or 240 half days per year","18-month job-search visa","https://www.daad.de/en","Uzbek school certificates often need Studienkolleg or one year of university before a bachelor; check uni-assist."],
 "Netherlands": ["English / Dutch","$10,000–20,000","$1,100–1,600","September","Up to 16h/week or full-time in summer","Orientation year visa (1 year)","https://www.studyinholland.nl","Apply through Studielink; many programmes have an early Jan 15 deadline."],
 "Finland": ["English / Finnish / Swedish","$8,000–15,000","$800–1,100","August/September","Up to 30h/week","2 years job-search permit","https://www.studyinfinland.fi","Joint application via Studyinfo in January."],
 "Denmark": ["English / Danish","$8,000–17,000","$1,000–1,400","September","20h/week in term","Up to 3 years establishment card","https://studyindenmark.dk","Apply through optagelse.dk; Mar 15 for non-EU."],
 "Sweden": ["English / Swedish","$12,000–20,000","$900–1,200","August/September","No hour limit","Up to 1 year job-search","https://www.universityadmissions.se","Apply through universityadmissions.se in January."],
 "Switzerland": ["German / French / English","$1,500–2,500","$1,600–2,200","September","15h/week after 6 months","6 months","https://www.swissuniversities.ch","Bachelor is usually taught in German or French; entrance exam may apply."],
 "Hungary": ["English / Hungarian","$3,000–10,000 (free with Stipendium Hungaricum)","$500–700","September","Allowed","1 year","https://stipendiumhungaricum.hu","Stipendium Hungaricum covers tuition, housing and a stipend; deadline mid-January."],
 "Poland": ["English / Polish","$2,000–5,000","$500–800","October","Allowed","9 months job search","https://study.gov.pl","Low cost and many English programmes; apply through each university."],
 "Italy": ["Italian / English","$1,000–5,000","$800–1,200","September/October","20h/week","12 months","https://www.universitaly.it","Pre-enrolment on Universitaly; DSU regional scholarships reduce costs."],
 "France": ["French / English","$3,000–15,000","$900–1,300","September","964 hours/year","Up to 2 years (master's)","https://www.campusfrance.org","Apply via Études en France; French level often required."],
 "South Korea": ["Korean / English","$4,000–10,000","$700–1,000","March/September","20h/week after language skills","Up to 2 years job search","https://www.studyinkorea.go.kr","GKS scholarship covers everything; many universities apply in September."],
 "Japan": ["Japanese / English","$4,000–11,000","$800–1,100","April/October","28h/week","1 year job-search visa","https://www.studyinjapan.go.jp","English-taught programmes include PEAK (Tokyo), iUP (Kyoto) and SPSF (Sophia)."],
 "China": ["Chinese / English","$3,000–6,000","$400–700","September","Limited","Limited","https://www.campuschina.org","Chinese Government Scholarship covers tuition, housing and a stipend."],
 "Singapore": ["English","$15,000–30,000","$900–1,300","August","16h/week","Employment pass","https://www.moe.gov.sg","Tuition Grant lowers fees in exchange for working in Singapore for three years."],
 "Turkey": ["Turkish / English","$3,000–25,000","$400–700","September","Limited","Limited","https://tr.study.gov.tr","Türkiye Scholarships cover tuition, housing and a stipend."],
 "Azerbaijan": ["Azerbaijani / English (ADA, Khazar)","$2,000–6,000","$400–700","September","Limited","Limited","https://edu.gov.az","Apply directly or through the government scholarship."],
 "Kazakhstan": ["Kazakh / Russian / English","$3,000–12,000","$350–600","September","Limited","Limited","https://studyinkazakhstan.kz","Nazarbayev University teaches in English; most others in Russian or Kazakh."],
 "Uzbekistan": ["Uzbek / Russian / English","$1,500–7,000","$250–450","September","Allowed","Allowed","https://edu.uz","Several international branch campuses offer English-taught degrees."],
 "Australia": ["English","$25,000–45,000","$1,400–2,200","February / July","48h per fortnight","2–4 years","https://www.studyaustralia.gov.au","Application deadlines vary by university; Oct 31 is a common early deadline."],
 "United Arab Emirates": ["English","$10,000–60,000","$1,200–1,800","September","Limited","Limited","https://u.ae/en/information-and-services/education","NYU Abu Dhabi is need-blind with large aid packages."],
}

def build_universities():
    out = []
    for line in FULL.strip().splitlines():
        p = line.split("|")
        assert len(p) == 18, (len(p), line[:60])
        (uid, name, short, city, country, typ, tuition, living, years, ielts, toefl, sat,
         accept, deadline, aid, strong, url, desc) = p
        tuition_n, living_n = num(tuition), num(living)
        out.append({
            "id": uid, "name": name, "short": short, "city": city, "country": country,
            "type": typ, "desc": desc, "tuition": tuition_n, "living": living_n,
            "years": num(years), "ielts": num(ielts), "toefl": num(toefl),
            "sat": sat if sat and sat != "-" else None,
            "accept": num(accept), "deadline": deadline or None,
            "aid": aid or None, "strong": [s for s in strong.split(",") if s],
            "url": url or None,
            "full": bool(tuition_n is not None and num(ielts) is not None and deadline),
        })
    seen = {u["id"] for u in out}
    for line in BASIC.strip().splitlines():
        name, city, country, desc = line.split("|")
        uid = slug(name)
        if uid in seen:
            continue
        seen.add(uid)
        out.append({"id": uid, "name": name, "short": name.replace("University of ", "").replace(" University", "")[:18],
                    "city": city, "country": country, "type": "University", "desc": desc,
                    "tuition": None, "living": None, "years": None, "ielts": None, "toefl": None,
                    "sat": None, "accept": None, "deadline": None, "aid": None, "strong": [],
                    "url": None, "full": False})
    out.sort(key=lambda u: u["name"].lower())
    return out

# ----------------------------------------------------------------- scholarships
# id|name|provider|country|levels|funding|deadline MM-DD|eligible nationalities (all | list; prefix ! = excluded regions note)|min ielts|min gpa(4.0 scale)|description|covers|docs|steps|url
SCH = """
berea|Berea College international funding|Berea College|United States|b|Full|11-30|all|6.5|3.0|Tuition-free education for admitted students; all students work on campus.|Tuition;Housing;Meals partly|Passport;Transcripts with translation;CV;Essays;Two recommendations|Create a Berea application;Submit financial documents;Take the English test if required;Wait for the decision|https://www.berea.edu/admissions
ugrad|Global UGRAD exchange|U.S. Department of State|United States|b|Full|11-30|all|-|-|One semester at a U.S. college for current undergraduates, with community service and a professional development program.|Tuition;Monthly stipend;Health insurance;Housing;Flights|Passport;Transcripts with translation;CV;Motivation letter;Essays;One recommendation|Check your U.S. Embassy's exchange page for the current call;Fill in the online application;Take the English test if invited;Attend the interview|https://exchanges.state.gov/non-us/program/global-ugrad
sophia|Sophia University scholarships|Sophia University|Japan|b|Partial|11-30|all|6.0|3.0|Tuition reductions for strong international applicants to English-taught programmes.|Tuition reduction|Passport;Transcripts;Essay;English test score|Apply to Sophia's English programme;Tick the scholarship box;Submit documents by the deadline|https://www.sophia.ac.jp/eng/admissions
ubc|UBC International Scholars|University of British Columbia|Canada|b|Full|12-01|all|6.5|3.5|Prestigious scholarship for top international undergraduates with leadership and service records.|Tuition;Living expenses|Transcripts;Personal profile;Two references|Apply to UBC by the scholarship deadline;Complete the personal profile;Wait for the nomination decision|https://you.ubc.ca/ubc-scholarships
bu|Boston University Trustee Scholarship|Boston University|United States|b|Full|01-04|all|6.5|3.7|Full-tuition merit scholarship for exceptional first-year applicants.|Tuition|Transcripts;Essays;Recommendations;Test scores if submitted|Apply to BU by the scholarship deadline;Complete the extra essay|https://www.bu.edu/admissions
lester|Lester B. Pearson International Scholarship|University of Toronto|Canada|b|Full|12-01|all|6.5|3.7|One of Canada's most generous scholarships for international undergraduates, nominated by their school.|Tuition;Books;Residence;Incidentals|School nomination;Transcripts;Essays|Ask your school to nominate you;Apply to U of T;Complete the scholarship profile|https://future.utoronto.ca/pearson
fulbright|Fulbright Foreign Student Program|U.S. Department of State|United States|m,p|Full|05-15|all|6.5|3.3|Master's and PhD funding in the US for outstanding graduates.|Tuition;Living stipend;Health insurance;Travel|Passport;Transcripts;CV;Statement of purpose;Three recommendations;Test scores|Check your country's Fulbright page;Apply online;Interview;Choose universities with Fulbright|https://foreign.fulbrightonline.org
chevening|Chevening Scholarships|UK Foreign, Commonwealth & Development Office|United Kingdom|m|Full|11-05|all|6.5|3.0|One-year master's in the UK for future leaders; two years of work experience required.|Tuition;Living stipend;Flights;Visa costs|Passport;Transcripts;CV;Four essays;Two references|Check country eligibility;Apply online;Choose three UK courses;Interview|https://www.chevening.org
erasmus|Erasmus Mundus Joint Masters|European Commission|Europe|m|Full|01-15|all|6.5|3.2|Joint master's programmes in at least two European countries.|Tuition;Travel;Living allowance|Passport;Transcripts;CV;Motivation letter;References;English test|Pick a programme on the Erasmus+ catalogue;Apply to the consortium;Submit the scholarship form|https://erasmus-plus.ec.europa.eu
daad|DAAD Scholarships|DAAD|Germany|m,p|Full|10-31|all|6.5|3.2|Master's and doctoral scholarships for studying in Germany.|Monthly stipend;Health insurance;Travel allowance|Passport;Transcripts;CV;Motivation letter;References;Language proof|Search the DAAD database;Apply to the programme and DAAD;Submit by the deadline|https://www2.daad.de/deutschland/stipendium/datenbank/en
sh|Stipendium Hungaricum|Tempus Public Foundation|Hungary|b,m,p|Full|01-15|all|6.0|3.0|Hungarian government scholarship for bachelor, master and PhD studies.|Tuition;Housing;Monthly stipend;Health insurance|Passport;Transcripts;Motivation letter;Language proof;Medical certificate|Check if your country participates;Apply on the Tempus portal;Complete university-specific requirements|https://stipendiumhungaricum.hu
gks|Global Korea Scholarship (GKS)|NIIED|South Korea|b,m,p|Full|03-31|all|6.0|3.0|Korean government scholarship including language training.|Tuition;Monthly allowance;Airfare;Language year|Passport;Transcripts;Study plan;Recommendations;Medical certificate|Check the embassy or university track;Prepare documents;Apply by the deadline|https://www.studyinkorea.go.kr
mext|MEXT Japanese Government Scholarship|Government of Japan|Japan|b,m,p|Full|05-15|all|6.0|3.0|Full scholarships for study in Japan, with an embassy or university track.|Tuition;Monthly stipend;Airfare|Passport;Transcripts;Study plan;Recommendation;Medical certificate|Contact the Japanese embassy;Submit the application;Take exams and interviews|https://www.studyinjapan.go.jp/en/planning/about-scholarship
turkiye|Türkiye Scholarships|Presidency for Turks Abroad|Turkey|b,m,p|Full|02-20|all|-|3.0|Turkish government scholarship for undergraduate and graduate students.|Tuition;Housing;Monthly stipend;Health insurance;Flights|Passport;Transcripts;CV;Reference letters|Create an account;Fill in the application;Wait for the interview|https://turkiyeburslari.gov.tr
azgov|Azerbaijan Government Scholarship|Government of Azerbaijan|Azerbaijan|b,m,p|Full|05-31|all|6.0|3.0|Government scholarship to study at Azerbaijani universities.|Tuition;Housing;Stipend|Passport;Transcripts;Language proof|Apply online;Wait for the placement|https://edu.gov.az
ada|ADA University scholarships|ADA University|Azerbaijan|b,m|Partial|06-30|all|6.0|3.0|Merit and need-based scholarships at ADA University.|Tuition reduction|Passport;Transcripts;English test|Apply to ADA;Tick the scholarship box|https://www.ada.edu.az/en/admissions
gates|Gates Cambridge Scholarship|Gates Cambridge Trust|United Kingdom|m,p|Full|12-03|all|7.0|3.7|Full-cost postgraduate scholarship at the University of Cambridge.|Tuition;Maintenance;Airfare;Visa costs|Transcripts;CV;References;Research proposal|Apply to Cambridge;Complete the Gates form;Interview|https://www.gatescambridge.org
clarendon|Clarendon Scholarships|University of Oxford|United Kingdom|m,p|Full|01-20|all|7.0|3.7|Fully funded graduate scholarships at Oxford; applicants are considered automatically.|Tuition;Living costs|Transcripts;CV;References;Written work|Apply to Oxford by the deadline;Considered automatically|https://www.ox.ac.uk/clarendon
knight|Knight-Hennessy Scholars|Stanford University|United States|m,p|Full|10-08|all|7.0|3.7|Graduate scholarship at Stanford for future leaders.|Tuition;Living stipend;Travel|Transcripts;Essays;Recommendations;Resume|Apply to the KHS programme;Apply to a Stanford department;Interview|https://knight-hennessy.stanford.edu
schwarzman|Schwarzman Scholars|Tsinghua University|China|m|Full|09-25|all|7.0|3.5|One-year master's in Global Affairs at Tsinghua.|Tuition;Housing;Travel;Stipend|Transcripts;Essays;Recommendations;Video|Apply online;Interview in selected cities|https://www.schwarzmanscholars.org
yenching|Yenching Academy|Peking University|China|m|Full|12-01|all|7.0|3.5|Interdisciplinary master's in China Studies at Peking University.|Tuition;Housing;Stipend|Transcripts;Essays;References;Study plan|Apply online;Interview|https://yenchingacademy.pku.edu.cn
csc|Chinese Government Scholarship (CSC)|China Scholarship Council|China|b,m,p|Full|03-31|all|-|3.0|Full scholarship for degree studies in China.|Tuition;Housing;Monthly stipend;Insurance|Passport;Transcripts;Study plan;Recommendations|Choose a university;Apply to the university;Submit CSC form|https://www.campuschina.org
eiffel|Eiffel Excellence Scholarship|Campus France|France|m,p|Full|01-08|all|6.5|3.5|Prestigious French government scholarship for master's and PhD students, submitted by French universities.|Stipend;Travel;Health insurance|CV;Transcripts;Letter from the French institution|Apply to a French university;The university nominates you|https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence
swedish|Swedish Institute Study Scholarships|Swedish Institute|Sweden|m|Full|02-10|all|6.5|3.2|Master's scholarships in Sweden for students from selected countries.|Tuition;Living stipend;Travel grant|Transcripts;Motivation letter;CV;Reference|Apply to Swedish university first;Apply for the SI scholarship|https://si.se/en/apply/scholarships
holland|Holland Scholarship|Dutch government|Netherlands|b,m|Partial|02-01|all|6.5|3.0|EUR 5,000 one-time scholarship for students from outside the EU.|Tuition contribution|Transcripts;Offer letter|Apply to a Dutch university;Request the scholarship|https://www.studyinnl.org/finances/holland-scholarship
rotary|Rotary Peace Fellowship|Rotary Foundation|Various|m,p|Full|05-15|all|6.5|3.0|Fully funded study in peace and conflict resolution.|Tuition;Living;Travel|Recommendations;Statement;Transcripts|Apply online;Sponsored by a Rotary district|https://www.rotary.org/en/our-programs/peace-fellowships
aga|Aga Khan Foundation International Scholarship|Aga Khan Foundation|Various|m,p|Partial|03-31|!eligible|6.5|3.0|50 percent grant and 50 percent loan for master's and PhD students from selected countries.|Grant and loan|Passport;Transcripts;Admission letter|Check country list;Apply to the AKF|https://www.akdn.org/our-agencies/aga-khan-foundation/international-scholarship-programme
bolashak|Bolashak International Scholarship|Government of Kazakhstan|Kazakhstan|m,p|Full|03-15|Kazakhstan|6.5|3.0|Fully funded study abroad for citizens of Kazakhstan.|Tuition;Stipend;Travel|Passport;Transcripts;Language test|Register online;Take the tests|https://bolashak.gov.kz
elyurt|El-Yurt Umidi|Government of Uzbekistan|Various|m,p|Full|06-30|Uzbekistan|6.5|3.0|Foundation that sponsors Uzbek citizens for graduate study abroad; calls change often.|Tuition;Stipend;Travel|Passport;Transcripts;Admission letter|Watch the foundation's announcements;Apply for the open call|https://eyuf.uz
mastercard|Mastercard Foundation Scholars|Mastercard Foundation|Various|b,m|Full|01-31|Africa|6.5|3.0|Full scholarships for African students at partner universities.|Tuition;Living;Travel|Passport;Transcripts;Essays|Apply through partner universities|https://mastercardfdn.org/all/scholars
commonwealth|Commonwealth Scholarships|Commonwealth Scholarship Commission|United Kingdom|m,p|Full|12-15|Commonwealth|6.5|3.3|UK scholarships for citizens of Commonwealth countries.|Tuition;Stipend;Flights|Transcripts;Proposal;References|Apply through your nominating agency|https://cscuk.fcdo.gov.uk
nus|NUS Undergraduate Scholarships|National University of Singapore|Singapore|b|Full|02-28|all|6.5|3.7|Merit scholarships for outstanding undergraduates at NUS.|Tuition;Living allowance|Transcripts;Test scores;Essays|Apply to NUS;The scholarship is included in the application|https://www.nus.edu.sg/oam/scholarships
kaist|KAIST International Student Scholarship|KAIST|South Korea|b|Full|09-20|all|6.0|3.5|KAIST gives generous scholarships to international undergraduates.|Tuition;Stipend|Transcripts;Recommendation;Study plan|Apply to KAIST|https://admission.kaist.ac.kr/intl-undergraduate
"""

def build_scholarships():
    out = []
    for line in SCH.strip().splitlines():
        p = line.split("|")
        assert len(p) == 15, (len(p), line[:60])
        (sid, name, provider, country, levels, funding, deadline, elig, ielts, gpa,
         desc, covers, docs, steps, url) = p
        out.append({
            "id": sid, "name": name, "provider": provider, "country": country,
            "levels": levels.split(","), "funding": funding, "deadline": deadline,
            "eligible": elig, "ielts": num(ielts), "gpa": num(gpa), "desc": desc,
            "covers": covers.split(";"), "docs": docs.split(";"), "steps": steps.split(";"),
            "url": url,
        })
    return out

ESSAYS = [
 {"id":"night-bus","title":"The Night Bus Home","type":"Personal essay","topic":"A long commute reframed as a classroom","summary":"A student turns a ninety-minute bus ride into the place where she learns to listen. The essay moves from boredom to curiosity about strangers, and ends with a changed way of studying.","why":["One scene carries the whole story","The turning point is a small, believable moment","The reflection says what changed in her, not just what happened"],"takeaway":"Pick a small, repeated routine; the change in how you see it is the story.","outline":["Open in the middle of the bus ride","Show what you used to think","Describe the moment that shifted it","Connect to how you study or lead now","End with a concrete next step"]},
 {"id":"broken-radio","title":"Fixing the Radio","type":"Personal essay","topic":"Repairing things with a grandfather","summary":"Learning to repair old radios from a grandfather becomes a lesson in patience and in respecting how things were built. The writer connects it to choosing electrical engineering.","why":["Concrete objects and sounds make it vivid","The relationship adds emotional depth","The link to the major feels earned, not announced"],"takeaway":"Let a hands-on activity explain your academic interest instead of stating it.","outline":["Start with the sound of the radio","Introduce the person who taught you","Describe one failure and what it taught","Connect to your major","Close with what you want to build"]},
 {"id":"debate-silence","title":"The Debate I Lost on Purpose","type":"Personal essay","topic":"Choosing to listen in a competition","summary":"A debater realises that winning arguments was making her a worse listener. She describes deliberately arguing the other side and what that revealed.","why":["Honest about a flaw","Specific example of changing behaviour","Shows maturity without sounding preachy"],"takeaway":"Admitting a limitation and showing growth beats listing achievements.","outline":["The moment you realised the problem","What you tried differently","A result, even a small one","What you do now"]},
 {"id":"why-us-engineering","title":"Why This University: Engineering","type":"Why us","topic":"Connecting specific resources to your goals","summary":"A strong 'Why us' essay names a lab, a course and a student project, and explains how each fits a goal the writer has already begun to pursue.","why":["Names specific, verifiable resources","Links each resource to past experience","Avoids generic praise about rankings"],"takeaway":"Replace adjectives about the school with evidence that you researched it.","outline":["One sentence about your goal","Two specific resources and why","One student community you would join","What you will contribute"]},
 {"id":"why-us-liberal-arts","title":"Why This College: Liberal Arts","type":"Why us","topic":"Explaining a love of breadth","summary":"A writer who loves both biology and literature explains how an open curriculum and small seminars let her combine them.","why":["Shows self-awareness about how they learn","Uses the college's own features as evidence","Short and precise"],"takeaway":"Show you understand what the school is, not only that it is famous.","outline":["Your two interests","Why most programmes separate them","The college feature that connects them","A specific course or project"]},
 {"id":"scholarship-leadership","title":"The Library We Built","type":"Scholarship essay","topic":"Community impact and leadership","summary":"A student organises a book drive to open a small library in a village school. The essay is about the setbacks, the team and the measurable results.","why":["Shows initiative with numbers","Credits others honestly","Looks forward to scaling the impact"],"takeaway":"Scholarship readers want proof of impact and a plan to continue it.","outline":["The problem","What you did first","What went wrong","Results with numbers","How the scholarship multiplies the impact"]},
 {"id":"scholarship-need","title":"What the Scholarship Makes Possible","type":"Scholarship essay","topic":"Explaining financial need with dignity","summary":"A candid, forward-looking explanation of financial circumstances, focused on what the writer has done with limited resources.","why":["Factual, not pitying","Shows resourcefulness","Ends with specific plans"],"takeaway":"Explain need through actions and plans, not through hardship alone.","outline":["The situation in two sentences","What you did anyway","What the funding unlocks","How you will give back"]},
 {"id":"sop-cs","title":"Statement of Purpose: Machine Learning","type":"Statement of purpose","topic":"Research interests for a master's application","summary":"A concise statement that names a research question, a past project, a method and two faculty whose work fits.","why":["Starts from a question, not a biography","Shows a real project with results","Names why this department"],"takeaway":"A statement of purpose is a research plan told as a story.","outline":["The question that drives you","A project that tested it","What you learned and the limits","Why this programme and these faculty","Your goal after the degree"]},
 {"id":"sop-policy","title":"Statement of Purpose: Public Policy","type":"Statement of purpose","topic":"From local problem to policy training","summary":"A candidate links a local water-access problem to the policy skills she needs, and describes the practical experience she brings.","why":["Concrete local problem","Clear skill gap","Realistic career path"],"takeaway":"Show the problem, the gap in your skills, and how the programme closes it.","outline":["The local problem","What you tried","The skill gap","The programme's role","The impact you aim for"]},
 {"id":"ucas-three","title":"UCAS Personal Statement: Three Questions","type":"Personal statement","topic":"Answering the UCAS questions directly","summary":"An example showing how to answer the three UCAS questions: why this course, how your studies prepared you, and what else you have done.","why":["Each question answered separately","Evidence from classes, not clichés","Extra-curriculars connected to the course"],"takeaway":"Answer each question directly, then support with specific evidence.","outline":["Why the course, with one specific moment","Two subjects and what you learned","One activity outside school","A closing sentence on readiness"]},
 {"id":"activity-short","title":"The 150-Word Activity Description","type":"Short answer","topic":"Writing the Activities list well","summary":"Shows how to compress an activity into verbs, numbers and results without wasting words.","why":["Starts with the action","Uses numbers","Shows leadership level"],"takeaway":"Lead with what you did, include one number, end with the result.","outline":["Role and organisation","Main action","Number or scale","Result"]},
 {"id":"challenge-failure","title":"The Robot That Would Not Move","type":"Personal essay","topic":"A failure and what it changed","summary":"A robotics team fails at a regional competition. The writer describes the debugging night and how it changed the way the team plans.","why":["Honest about the failure","Technical detail kept simple","Ends with a lasting habit"],"takeaway":"Failure essays work when the lesson becomes a habit you still keep.","outline":["The failure in one line","The night of debugging","The insight","The habit you kept"]},
]

PROMPTS = [
 {"id":"ca1","label":"Common App: your story","limit":650,"text":"Some students have a background, identity, interest, or talent so meaningful they believe their application would be incomplete without it. Share your story."},
 {"id":"ca2","label":"Common App: a setback","limit":650,"text":"The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?"},
 {"id":"ca3","label":"Common App: questioning a belief","limit":650,"text":"Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?"},
 {"id":"ca4","label":"Common App: gratitude","limit":650,"text":"Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?"},
 {"id":"ca5","label":"Common App: personal growth","limit":650,"text":"Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others."},
 {"id":"ca6","label":"Common App: a captivating topic","limit":650,"text":"Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?"},
 {"id":"ca7","label":"Common App: topic of your choice","limit":650,"text":"Share an essay on any topic of your choice. It can be one you have already written, one that responds to a different prompt, or one of your own design."},
 {"id":"why","label":"Why this university","limit":250,"text":"Why are you interested in this university, and how will its programmes and community help you reach your goals?"},
 {"id":"scholar","label":"Scholarship motivation letter","limit":500,"text":"Describe your goals, your achievements so far, and how this scholarship will help you contribute to your community."},
 {"id":"sop","label":"Statement of purpose","limit":1000,"text":"Describe your academic background, research or professional experience, why you want this programme, and your plans after the degree."},
 {"id":"ucas","label":"UCAS personal statement","limit":650,"text":"Why do you want to study this course? How have your qualifications and studies helped you prepare? What else have you done to prepare outside of education?"},
]

TESTS = [
 {"id":"ielts","name":"IELTS Academic","note":"Most universities ask for 6.5–7.0 overall.","scale":"0–9","max":9,"url":"https://ielts.org"},
 {"id":"toefl","name":"TOEFL iBT","note":"Top US colleges usually expect 100+.","scale":"0–120","max":120,"url":"https://www.ets.org/toefl"},
 {"id":"sat","name":"SAT","note":"Digital SAT, scored 400–1600.","scale":"400–1600","max":1600,"url":"https://satsuite.collegeboard.org"},
 {"id":"duolingo","name":"Duolingo English Test","note":"Accepted by many US universities.","scale":"10–160","max":160,"url":"https://englishtest.duolingo.com"},
 {"id":"gre","name":"GRE General","note":"Some master's programs require it.","scale":"260–340","max":340,"url":"https://www.ets.org/gre"},
 {"id":"gmat","name":"GMAT Focus","note":"For business master's and MBA programs.","scale":"205–805","max":805,"url":"https://www.mba.com/exams/gmat-focus-edition"},
 {"id":"ap","name":"AP Exams","note":"Scores of 4–5 can earn credit.","scale":"1–5","max":5,"url":"https://apstudents.collegeboard.org"},
]

RESOURCES = [
 {"group":"Applying","items":[
  ["Common App","One application for 1,000+ US colleges.","https://www.commonapp.org"],
  ["UCAS","The UK undergraduate application system.","https://www.ucas.com"],
  ["uni-assist","Document check for many German universities.","https://www.uni-assist.de"],
  ["Studielink","Application portal for Dutch universities.","https://www.studielink.nl"],
  ["Universitaly","Pre-enrolment for Italian universities.","https://www.universitaly.it"],
  ["Studyinfo","Joint application for Finnish universities.","https://studyinfo.fi"]]},
 {"group":"Test prep","items":[
  ["Bluebook & Khan Academy SAT","Official full-length digital SAT practice.","https://satsuite.collegeboard.org"],
  ["IELTS official practice","Sample tests and band descriptors.","https://ielts.org"],
  ["British Council Uzbekistan","IELTS dates and test centres in Uzbekistan.","https://www.britishcouncil.uz"],
  ["ETS TOEFL","Official TOEFL preparation and registration.","https://www.ets.org/toefl"]]},
 {"group":"Funding","items":[
  ["CSS Profile","Financial aid form for many US colleges.","https://cssprofile.collegeboard.org"],
  ["DAAD Scholarship Database","Search German funding by level and field.","https://www2.daad.de/deutschland/stipendium/datenbank/en"],
  ["Study in Korea","Official GKS portal and notices.","https://www.studyinkorea.go.kr"],
  ["Stipendium Hungaricum","Hungarian government scholarships.","https://stipendiumhungaricum.hu"],
  ["EducationUSA","Free advising for studying in the United States.","https://educationusa.state.gov"]]},
]

def main():
    unis = build_universities()
    schs = build_scholarships()
    majors = [{"id": i, "name": n, "category": c, "courses": co, "careers": ca} for i, n, c, co, ca in MAJORS]
    guides = {k: dict(zip(["language","tuition","living","intake","workDuring","workAfter","portal","note"], v)) for k, v in GUIDES.items()}
    files = {"universities": unis, "scholarships": schs, "majors": majors, "essays": ESSAYS,
             "prompts": PROMPTS, "tests": TESTS, "resources": RESOURCES, "guides": guides}
    for name, obj in files.items():
        with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    countries = {u["country"] for u in unis}
    full = sum(1 for u in unis if u["full"])
    print(f"universities: {len(unis)} in {len(countries)} countries ({full} with full data)")
    print(f"scholarships: {len(schs)}  majors: {len(majors)}  essays: {len(ESSAYS)}  guides: {len(guides)}")

if __name__ == "__main__":
    main()
