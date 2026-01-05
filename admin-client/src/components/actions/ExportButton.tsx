import { useRef, useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ExportSquare, DocumentText, FilterSearch } from 'iconsax-react';

interface ExportButtonProps {
    onExportAll: () => void;
    onExportFiltered: () => void;
    disabled?: boolean;
}

const ExportButton = ({ onExportAll, onExportFiltered, disabled }: ExportButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outlined"
                color="secondary"
                startIcon={<ExportSquare size={18} />}
                onClick={() => setIsOpen(true)}
                ref={ref}
                disabled={disabled}
            >
                Xuất Excel
            </Button>
            <Menu
                anchorEl={ref.current}
                open={isOpen}
                onClose={() => setIsOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => { onExportAll(); setIsOpen(false); }}>
                    <ListItemIcon>
                        <DocumentText size={18} />
                    </ListItemIcon>
                    <ListItemText primary="Xuất toàn bộ" />
                </MenuItem>
                <MenuItem onClick={() => { onExportFiltered(); setIsOpen(false); }}>
                    <ListItemIcon>
                        <FilterSearch size={18} />
                    </ListItemIcon>
                    <ListItemText primary="Xuất theo bộ lọc hiện tại" />
                </MenuItem>
            </Menu>
        </>
    );
};

export default ExportButton;
