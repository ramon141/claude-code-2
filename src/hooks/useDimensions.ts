import { useState, useEffect } from 'react';

interface Dimensions {
    width: number;
    height: number;
}

const useDimensions = (): Dimensions => {
    const [dimensions, setDimensions] = useState<Dimensions>({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return dimensions;
};

export default useDimensions;
