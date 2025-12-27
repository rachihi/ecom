import { useRef, useState } from 'react';
import { Button, CircularProgress, ButtonGroup, Menu, MenuItem } from '@mui/material';
import { ImportSquare, DocumentDownload } from 'iconsax-react';

interface ImportButtonProps {
    onImport: (file: File) => Promise<void>;
    isLoading?: boolean;
    onDownloadTemplate?: () => void;
}

const ImportButton = ({ onImport, isLoading, onDownloadTemplate }: ImportButtonProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            await onImport(file);
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
            />

            {onDownloadTemplate ? (
                <ButtonGroup variant="outlined" color="primary">
                    <Button
                        startIcon={isLoading ? <CircularProgress size={18} /> : <ImportSquare size={18} />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang nhập...' : 'Nhập Excel'}
                    </Button>
                    <Button onClick={onDownloadTemplate} title="Tải file mẫu">
                        <DocumentDownload size={18} />
                    </Button>
                </ButtonGroup>
            ) : (
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={18} /> : <ImportSquare size={18} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang nhập...' : 'Nhập Excel'}
                </Button>
            )}
        </>
    );
};

export default ImportButton;
