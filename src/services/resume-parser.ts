
import * as pdfjsLib from 'pdfjs-dist';

// Use a specific version to match the installed package
const PDFJS_VERSION = '3.11.174';

// Use a CDN for the worker to avoid complex build configuration changes
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

export interface ParsedResume {
    text: string;
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    links?: string[];
}

export async function extractTextFromPdf(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        // Using explicit generic version if 'pdfjs-dist' types are insufficient
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';


        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (e) {
        console.error('Error in extractTextFromPdf', e);
        throw e;
    }
}

export async function parseResume(file: File): Promise<ParsedResume> {
    let text = '';
    console.log('Parsing resume file:', file.name, file.type);

    if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
    } else if (file.type === 'text/plain') {
        text = await file.text();
    } else {
        throw new Error('Unsupported file type. Please upload PDF or Text.');
    }

    // Basic Heuristic Extraction
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/;
    const urlRegex = /https?:\/\/[^\s]+/g;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const links = text.match(urlRegex) || [];

    // Simple Skill keyword matching
    const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
        'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL',
        'Git', 'CI/CD', 'Agile', 'Scrum', 'Leadership', 'Management',
        'Machine Learning', 'AI', 'TensorFlow', 'PyTorch', 'Data Science'
    ];

    const foundSkills = commonSkills.filter(skill =>
        new RegExp(`\\b${skill}\\b`, 'i').test(text)
    );

    console.log('Resume parsed successfully:', { textLength: text.length, skills: foundSkills.length });

    return {
        text,
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        skills: foundSkills,
        links: links
    };
}
