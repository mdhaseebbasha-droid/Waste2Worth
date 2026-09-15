import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Camera,
  ArrowRight,
  Recycle,
  DollarSign,
  Hammer,
  HeartHandshake,
  CheckCircle2,
  Package,
  Layers,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { POPULAR_WASTE_MATERIALS } from '../data/materials.ts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectPopularMaterial = (materialName: string) => {
    // Navigate to select with this material pre-selected
    navigate('/select', { state: { preSelected: [materialName] } });
  };

  const steps = [
    {
      num: '01',
      title: 'Select Your Waste',
      description:
        'Choose from everyday household items like plastic bottles, cardboard, jars, or upload a quick photo for AI detection.',
      icon: Layers,
      highlight: '12+ standard materials & custom items supported',
    },
    {
      num: '02',
      title: 'Let AI Find Ideas',
      description:
        'Gemini AI analyzes structural properties and generates 5 creative, practical DIY tutorials tailored to your exact materials.',
      icon: Sparkles,
      highlight: 'Tailored to low-cost household tools & safety',
    },
    {
      num: '03',
      title: 'Create Something Useful',
      description:
        'Follow interactive step-by-step instructions, safety guidelines, and curated YouTube video tutorials to build your craft.',
      icon: Hammer,
      highlight: 'Interactive checklists & saved cloud projects',
    },
  ];

  const benefits = [
    {
      title: 'Reduce Waste',
      description:
        'Divert household packaging, plastics, and paper directly from landfills into functional items.',
      icon: Recycle,
      accent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      title: 'Save Money',
      description:
        'Craft your own organizers, plant pots, wall decor, and storage without buying expensive plastic products.',
      icon: DollarSign,
      accent: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      title: 'Learn DIY Skills',
      description:
        'Gain confidence in measuring, cutting, assembling, and decorating with realistic beginner-friendly guides.',
      icon: Hammer,
      accent: 'bg-stone-100 text-stone-800 border-stone-200',
    },
    {
      title: 'Give Items a Second Life',
      description:
        'Transform single-use packaging into cherished home decor, desk utilities, and creative family projects.',
      icon: HeartHandshake,
      accent: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  ];

  const exampleIdeas = [
    {
      title: 'Tiered Desk Organizer',
      materials: 'Plastic bottles + Cardboard',
      category: 'Storage',
      time: '35 mins',
      difficulty: 'Easy',
    },
    {
      title: 'Hanging Herb Planter',
      materials: 'Plastic bottle + Twine',
      category: 'Garden',
      time: '20 mins',
      difficulty: 'Easy',
    },
    {
      title: 'Acoustic Phone Amplifier',
      materials: 'Tin can + Cardboard tube',
      category: 'Audio',
      time: '25 mins',
      difficulty: 'Medium',
    },
    {
      title: 'Woven Coasters',
      materials: 'Newspaper + PVA Glue',
      category: 'Home Decor',
      time: '45 mins',
      difficulty: 'Easy',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background soft gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute top-[600px] -left-40 w-[450px] h-[450px] bg-teal-100/30 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 border border-emerald-200 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 shadow-2xs mb-6">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            <span>Powered by Gemini AI Multimodal Vision & Generation</span>
          </div>

          {/* Main Hero Header */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-display leading-[1.15] max-w-4xl mx-auto">
            Turn Your Waste Into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800">
              Something Worthwhile.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Tell us what waste you have. Our AI will find creative ways to reuse it.
          </p>

          {/* Action CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            <button
              id="hero-start-creating-btn"
              onClick={() => navigate('/select')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-7 py-3.5 text-base font-semibold shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-150"
            >
              <span>Start Creating</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              id="hero-upload-waste-photo-btn"
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 px-6 py-3.5 text-base font-semibold shadow-2xs transition"
            >
              <Camera className="h-4 w-4 text-emerald-700" />
              <span>Upload Waste Photos</span>
            </button>
          </div>

          {/* Interactive Quick Pick Carousel */}
          <div className="mt-12 pt-8 border-t border-stone-200/80">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Common Household Materials You Can Reuse Today
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {POPULAR_WASTE_MATERIALS.slice(0, 8).map((mat) => (
                <button
                  key={mat.id}
                  id={`quick-pick-${mat.id}`}
                  onClick={() => handleSelectPopularMaterial(mat.name)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:border-emerald-500 hover:text-emerald-800 hover:bg-emerald-50/50 shadow-2xs transition"
                >
                  <span className="text-emerald-700 font-bold">+</span>
                  <span>{mat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
              Simple 3-Step Process
            </h2>
            <h3 className="text-3xl font-extrabold text-stone-900 font-display">
              How Waste2Worth Works
            </h3>
            <p className="mt-2 text-stone-600 text-sm sm:text-base">
              From clutter to craftsmanship in seconds without costly crafting kits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  id={`step-card-${step.num}`}
                  className="relative rounded-2xl border border-stone-200 bg-stone-50/60 p-7 flex flex-col justify-between hover:shadow-md hover:border-stone-300 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-12 w-12 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-emerald-800">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-3xl font-extrabold text-stone-300 font-display">
                        {step.num}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-stone-900 font-display mb-2">
                      {step.title}
                    </h4>
                    <p className="text-stone-600 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-200/70 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>{step.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Showcase / Inspiration preview */}
      <section className="py-16 bg-stone-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Inspiration Preview
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display mt-1">
                What Can You Make With Waste?
              </h3>
            </div>
            <button
              onClick={() => navigate('/select')}
              className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
            >
              <span>Explore all materials</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {exampleIdeas.map((idea, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-600">
                      {idea.category}
                    </span>
                    <span className="font-semibold text-emerald-700">{idea.time}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 font-display text-base mb-1.5">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-stone-500 mb-4 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span>{idea.materials}</span>
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">
                    Difficulty: <strong className="text-stone-700">{idea.difficulty}</strong>
                  </span>
                  <button
                    onClick={() =>
                      navigate('/select', {
                        state: { preSelected: idea.materials.split(' + ') },
                      })
                    }
                    className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Try This</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white border-t border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
              Why Upcycle
            </h2>
            <h3 className="text-3xl font-extrabold text-stone-900 font-display">
              Transform Everyday Discards Into Value
            </h3>
            <p className="mt-2 text-stone-600 text-sm sm:text-base">
              Upcycling is more than crafting—it's a sustainable mindset for home and community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  id={`benefit-card-${idx}`}
                  className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 flex flex-col justify-start hover:border-emerald-200 transition"
                >
                  <div
                    className={`h-11 w-11 rounded-xl border flex items-center justify-center mb-4 ${benefit.accent}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900 font-display mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Banner CTA */}
      <section className="py-16 bg-gradient-to-br from-emerald-800 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Ready to give your household waste a second life?
          </h2>
          <p className="mt-4 text-emerald-100 text-base sm:text-lg max-w-xl mx-auto">
            Select your materials or snap a photo. In seconds, Gemini AI will build 5 step-by-step DIY project blueprints.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/select')}
              className="w-full sm:w-auto rounded-xl bg-white text-emerald-900 hover:bg-stone-100 px-8 py-3.5 text-base font-bold shadow-lg transition"
            >
              Start Selecting Waste
            </button>
            <button
              onClick={() => navigate('/scan')}
              className="w-full sm:w-auto rounded-xl border border-emerald-300/40 bg-emerald-700/50 hover:bg-emerald-700/80 text-white px-7 py-3.5 text-base font-semibold transition"
            >
              Scan with Camera
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
