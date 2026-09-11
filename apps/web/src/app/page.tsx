import { Badge } from '@lexigov/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@lexigov/ui/components/card';
import { FileText, Shield, Sparkles, Zap } from 'lucide-react';
import type React from 'react';
import { HomeCtaActions, HomeHeroActions, HomeNavActions } from '@/components/home-auth-actions';

export default function Home() {
  return (
    <div className='min-h-screen bg-linear-to-b from-background to-muted/20'>
      {/* Navigation */}
      <nav className='flex items-center justify-between px-6 py-4 max-w-7xl mx-auto'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-primary rounded-lg flex items-center justify-center'>
            <span className='text-primary-foreground font-bold text-xl'>L</span>
          </div>
          <span className='text-xl font-bold'>LexiGov AI</span>
        </div>
        <div className='flex items-center gap-4'>
          <HomeNavActions />
        </div>
      </nav>

      {/* Hero Section */}
      <section className='px-6 py-20 max-w-7xl mx-auto text-center'>
        <Badge variant='secondary' className='mb-8 px-4 py-2 text-sm'>
          <Sparkles className='w-4 h-4 mr-2' />
          Powered by Azure AI
        </Badge>
        <h1 className='text-5xl md:text-6xl font-bold mb-6 leading-tight'>
          Draft Philippine Ordinances
          <br />
          <span className='text-primary'>with AI Precision</span>
        </h1>
        <p className='text-xl text-muted-foreground mb-10 max-w-2xl mx-auto'>
          Create local government ordinance drafts with RA 7160-aware guidance. AI-assisted drafting, advisory checks, and
          template library for Philippine LGUs.
        </p>
        <div className='flex items-center justify-center gap-4'>
          <HomeHeroActions />
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='px-6 py-20 bg-background'>
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold mb-4'>Everything You Need for Legal Drafting</h2>
            <p className='text-muted-foreground max-w-2xl mx-auto'>
              Streamline your ordinance creation process with powerful AI tools designed specifically for Philippine
              local government compliance.
            </p>
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <FeatureCard
              icon={Sparkles}
              title='AI Generation'
              description='Generate complete ordinance drafts from simple prompts using Azure OpenAI'
            />
            <FeatureCard
              icon={Shield}
              title='RA 7160 Compliance'
              description='Automatic compliance checking against the Local Government Code of 1991'
            />
            <FeatureCard
              icon={FileText}
              title='Template Library'
              description='Pre-built templates for common ordinances: curfew, business permits, traffic, and more'
            />
            <FeatureCard
              icon={Zap}
              title='Export Options'
              description='Export drafts to plain text and Markdown for review, filing, and further editing'
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='px-6 py-20'>
        <Card className='max-w-4xl mx-auto bg-primary text-primary-foreground border-0'>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl'>Ready to Modernize Your Legislative Process?</CardTitle>
            <CardDescription className='text-primary-foreground/80 text-lg'>
              Join LGUs across the Philippines using LexiGov AI to draft better ordinances faster.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex justify-center pb-8'>
            <HomeCtaActions />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className='px-6 py-8 border-t'>
        <div className='max-w-7xl mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
              <span className='text-primary-foreground font-bold'>L</span>
            </div>
            <span className='font-semibold'>LexiGov AI</span>
          </div>
          <p className='text-muted-foreground text-sm'>RA 7160-Aware Drafting • Philippine Local Government</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className='hover:shadow-lg transition-shadow'>
      <CardHeader>
        <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
          <Icon className='w-6 h-6 text-primary' />
        </div>
        <CardTitle className='text-lg'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
